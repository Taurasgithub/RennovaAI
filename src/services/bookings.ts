import type { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';
import type { DesignChoices, Estimate } from '../lib/estimate';
import { accountsEnabled, supabase } from '../lib/supabase';

/**
 * Bookings between customers and vendors, stored in Supabase (see supabase/migrations/0004_projects.sql).
 * Request-based: no money moves through the app. Customer requests → vendor accepts/declines →
 * vendor marks each stage done → customer confirms it. Customers pay the vendor directly.
 * Every change goes through a database function that checks who is calling.
 */

export type BookingStatus = 'requested' | 'accepted' | 'declined' | 'completed' | 'cancelled';
export type StageStatus = 'pending' | 'submitted' | 'approved';

export type Stage = { id: string; stage: number; pct: number; amount: number; status: StageStatus; submittedAt: string | null; approvedAt: string | null };

/** What the vendor sees of the customer's design (a snapshot taken when the booking was made). */
export type BookingDesign = {
  name: string;
  nameParts?: { styleId: string; roomTypeId: string; n: number } | null;
  choices: DesignChoices;
  estimate: Estimate;
  photo_path?: string | null;
  result_path?: string | null;
  result_mode?: 'ai' | 'preview' | 'illustration';
};

export type Booking = {
  id: string;
  customerId: string;
  vendorId: string | null;
  designId: string | null;
  design: BookingDesign;
  /** Short-lived signed URLs for the design images (private bucket). */
  photoUrl: string | null;
  resultUrl: string | null;
  title: string;
  price: number;
  days: number;
  startPref: string;
  note: string;
  status: BookingStatus;
  declineReason: string | null;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  vendorName: string;
  rating: number | null;
  review: string | null;
  createdAt: string;
  updatedAt: string;
  stages: Stage[];
};

export type ChatMessage = { id: string; projectId: string; senderId: string | null; body: string; createdAt: string };

type ProjectRow = {
  id: string; customer_id: string; vendor_id: string | null; design_id: string | null; design: BookingDesign; title: string;
  price: number; days: number; start_pref: string; note: string; status: BookingStatus; decline_reason: string | null;
  customer_name: string; customer_phone: string; customer_city: string; vendor_name: string; rating: number | null;
  review: string | null; created_at: string; updated_at: string;
  milestones: { id: string; stage: number; pct: number; amount: number; status: StageStatus; submitted_at: string | null; approved_at: string | null }[];
};
type MessageRow = { id: string; project_id: string; sender_id: string | null; body: string; created_at: string };

const SELECT = '*, milestones(*)';

async function signImages(rows: ProjectRow[]) {
  const paths = [...new Set(rows.flatMap((r) => [r.design?.photo_path, r.design?.result_path]).filter((p): p is string => !!p))];
  if (!paths.length) return new Map<string, string>();
  const { data } = await supabase.storage.from('designs').createSignedUrls(paths, 60 * 60 * 6);
  return new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl as string]));
}

function toBooking(r: ProjectRow, urls: Map<string, string>): Booking {
  return {
    id: r.id,
    customerId: r.customer_id,
    vendorId: r.vendor_id,
    designId: r.design_id,
    design: r.design,
    photoUrl: (r.design?.photo_path && urls.get(r.design.photo_path)) || null,
    resultUrl: (r.design?.result_path && urls.get(r.design.result_path)) || null,
    title: r.title,
    price: r.price,
    days: r.days,
    startPref: r.start_pref,
    note: r.note,
    status: r.status,
    declineReason: r.decline_reason,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerCity: r.customer_city,
    vendorName: r.vendor_name,
    rating: r.rating,
    review: r.review,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    stages: [...(r.milestones ?? [])]
      .sort((a, b) => a.stage - b.stage)
      .map((m) => ({ id: m.id, stage: m.stage, pct: Number(m.pct), amount: m.amount, status: m.status, submittedAt: m.submitted_at, approvedAt: m.approved_at })),
  };
}

const toMessage = (m: MessageRow): ChatMessage => ({ id: m.id, projectId: m.project_id, senderId: m.sender_id, body: m.body, createdAt: m.created_at });

/** Turns a database error into a short message for the UI. */
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

type BookingsState = {
  userId: string | null;
  loaded: boolean;
  error: string | null;
  bookings: Booking[];
  messages: Record<string, ChatMessage[]>;
  /** Called by AuthProvider on sign-in / sign-out. */
  start: (userId: string | null) => Promise<void>;
  reload: () => Promise<void>;
  refreshOne: (id: string) => Promise<void>;
  loadMessages: (projectId: string) => Promise<void>;
  request: (p: {
    vendorId: string; designId: string | null; design: BookingDesign; title: string; price: number; days: number; start: string; note: string;
  }) => Promise<string>;
  respond: (id: string, accept: boolean, reason?: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  submitStage: (bookingId: string, stageId: string) => Promise<void>;
  approveStage: (bookingId: string, stageId: string) => Promise<void>;
  rate: (id: string, rating: number, review: string) => Promise<void>;
  send: (projectId: string, body: string) => Promise<void>;
};

let channel: RealtimeChannel | null = null;

export const useBookings = create<BookingsState>((set, get) => ({
  userId: null,
  loaded: false,
  error: null,
  bookings: [],
  messages: {},

  start: async (userId) => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    set({ userId, loaded: false, error: null, bookings: [], messages: {} });
    if (!userId || !accountsEnabled()) return set({ loaded: true });
    // Row-level security limits these events to bookings the user is part of.
    channel = supabase
      .channel(`bookings-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (e) => {
        const id = (e.new as { id?: string })?.id ?? (e.old as { id?: string })?.id;
        if (id) get().refreshOne(id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, (e) => {
        const id = (e.new as { project_id?: string })?.project_id;
        if (id) get().refreshOne(id);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (e) => {
        const m = toMessage(e.new as MessageRow);
        const list = get().messages[m.projectId];
        if (list && !list.some((x) => x.id === m.id)) set({ messages: { ...get().messages, [m.projectId]: [...list, m] } });
      })
      .subscribe();
    await get().reload();
  },

  reload: async () => {
    const userId = get().userId;
    if (!userId) return;
    const { data, error } = await supabase.from('projects').select(SELECT).order('created_at', { ascending: false });
    if (get().userId !== userId) return;
    if (error) return set({ loaded: true, error: error.message });
    const rows = (data ?? []) as ProjectRow[];
    const urls = await signImages(rows);
    set({ loaded: true, error: null, bookings: rows.map((r) => toBooking(r, urls)) });
  },

  refreshOne: async (id) => {
    const { data } = await supabase.from('projects').select(SELECT).eq('id', id).maybeSingle();
    const others = get().bookings.filter((b) => b.id !== id);
    if (!data) return set({ bookings: others });
    const row = data as ProjectRow;
    const prev = get().bookings.find((b) => b.id === id);
    // Keep already-signed image URLs; only sign for bookings we haven't seen.
    const urls = prev
      ? new Map([[row.design?.photo_path ?? '', prev.photoUrl ?? ''], [row.design?.result_path ?? '', prev.resultUrl ?? '']])
      : await signImages([row]);
    const next = toBooking(row, urls);
    set({ bookings: [next, ...others].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  },

  loadMessages: async (projectId) => {
    const { data, error } = await supabase.from('messages').select('*').eq('project_id', projectId).order('created_at');
    fail(error);
    set({ messages: { ...get().messages, [projectId]: ((data ?? []) as MessageRow[]).map(toMessage) } });
  },

  request: async (p) => {
    const { data, error } = await supabase.rpc('request_booking', {
      p_vendor: p.vendorId, p_design_id: p.designId, p_design: p.design, p_title: p.title,
      p_price: Math.round(p.price), p_days: Math.max(1, Math.round(p.days)), p_start: p.start, p_note: p.note,
    });
    fail(error);
    await get().refreshOne(data as string);
    return data as string;
  },

  respond: async (id, accept, reason) => {
    fail((await supabase.rpc('respond_booking', { p_project: id, p_accept: accept, p_reason: reason ?? null })).error);
    await get().refreshOne(id);
  },

  cancel: async (id) => {
    fail((await supabase.rpc('cancel_booking', { p_project: id })).error);
    await get().refreshOne(id);
  },

  submitStage: async (bookingId, stageId) => {
    fail((await supabase.rpc('submit_milestone', { p_milestone: stageId })).error);
    await get().refreshOne(bookingId);
  },

  approveStage: async (bookingId, stageId) => {
    fail((await supabase.rpc('approve_milestone', { p_milestone: stageId })).error);
    await get().refreshOne(bookingId);
  },

  rate: async (id, rating, review) => {
    fail((await supabase.rpc('rate_project', { p_project: id, p_rating: rating, p_review: review })).error);
    await get().refreshOne(id);
  },

  send: async (projectId, body) => {
    const { data, error } = await supabase.from('messages').insert({ project_id: projectId, body }).select().single();
    fail(error);
    const m = toMessage(data as MessageRow);
    const list = get().messages[projectId] ?? [];
    if (!list.some((x) => x.id === m.id)) set({ messages: { ...get().messages, [projectId]: [...list, m] } });
  },
}));

/** Bookings that still need the current user's attention, for tab badges. */
export const needsAction = (b: Booking, userId: string | null) => {
  if (b.vendorId === userId) return b.status === 'requested' || (b.status === 'accepted' && nextStage(b)?.status === 'pending');
  return b.status === 'accepted' && b.stages.some((s) => s.status === 'submitted');
};

/** The first stage that isn't confirmed yet. */
export const nextStage = (b: Booking) => b.stages.find((s) => s.status !== 'approved');
