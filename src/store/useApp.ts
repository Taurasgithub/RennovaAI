import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DesignChoices, Estimate } from '../lib/estimate';
import { uid } from '../lib/format';
import type { ServiceType } from '../data/catalog';

export type User = { name: string; phone: string; city: string };

export type ResultMode = 'ai' | 'preview' | 'illustration';

export type Design = {
  id: string;
  name: string;
  createdAt: string;
  choices: DesignChoices;
  photoUri: string | null; // null = sample room illustration
  resultUri: string | null; // AI-rendered image (data URI or remote URL)
  resultMode: ResultMode;
  regenerations: number;
  premium: boolean;
  estimate: Estimate;
};

export type MilestoneStatus = 'awaiting_deposit' | 'in_escrow' | 'released';
export type Milestone = { id: string; title: string; pct: number; amount: number; status: MilestoneStatus };
export type Message = { id: string; from: 'me' | 'vendor'; text: string; at: string };

export type Project = {
  id: string;
  designId: string;
  vendorId: string;
  title: string;
  price: number;
  discount: number;
  days: number;
  paymentMethod: string;
  createdAt: string;
  status: 'active' | 'completed';
  milestones: Milestone[];
  messages: Message[];
  rating?: number;
  review?: string;
};

export type VendorApplication = {
  businessName: string;
  ownerName: string;
  phone: string;
  city: string;
  services: ServiceType[];
  years: string;
  about: string;
  photos: string[];
  submittedAt: string;
  step: number; // 0..4 verification steps completed
};

export type Draft = DesignChoices & { photoUri: string | null };

export const emptyDraft = (): Draft => ({
  photoUri: null,
  roomTypeId: 'living',
  area: 250,
  styleId: 'modern',
  paletteId: 'teal-feature',
  wallFinishId: 'washable',
  flooringId: 'porcelain',
  ceilingId: 'cove',
  extras: [],
  notes: '',
});

type State = {
  hydrated: boolean;
  onboarded: boolean;
  user: User | null;
  draft: Draft;
  designs: Design[];
  projects: Project[];
  vendorApplication: VendorApplication | null;
  referralUsed: boolean;
  studentPackClaimed: boolean;
};

type Actions = {
  setUser: (u: User) => void;
  completeOnboarding: () => void;
  updateDraft: (p: Partial<Draft>) => void;
  resetDraft: () => void;
  saveDesign: (d: Omit<Design, 'id' | 'createdAt'>) => string;
  updateDesign: (id: string, p: Partial<Design>) => void;
  deleteDesign: (id: string) => void;
  createProject: (p: Omit<Project, 'id' | 'createdAt' | 'status' | 'messages'>) => string;
  depositMilestone: (projectId: string, milestoneId: string) => void;
  releaseMilestone: (projectId: string, milestoneId: string) => void;
  addMessage: (projectId: string, m: Omit<Message, 'id' | 'at'>) => void;
  rateProject: (projectId: string, rating: number, review: string) => void;
  submitVendorApplication: (a: Omit<VendorApplication, 'submittedAt' | 'step'>) => void;
  markReferralUsed: () => void;
  claimStudentPack: () => void;
  resetAll: () => void;
};

const initial: State = {
  hydrated: false,
  onboarded: false,
  user: null,
  draft: emptyDraft(),
  designs: [],
  projects: [],
  vendorApplication: null,
  referralUsed: false,
  studentPackClaimed: false,
};

const mapProject = (projects: Project[], id: string, fn: (p: Project) => Project) =>
  projects.map((p) => (p.id === id ? fn(p) : p));

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      setUser: (user) => set({ user }),
      completeOnboarding: () => set({ onboarded: true }),
      updateDraft: (p) => set({ draft: { ...get().draft, ...p } }),
      resetDraft: () => set({ draft: emptyDraft() }),
      saveDesign: (d) => {
        const id = uid();
        set({ designs: [{ ...d, id, createdAt: new Date().toISOString() }, ...get().designs] });
        return id;
      },
      updateDesign: (id, p) => set({ designs: get().designs.map((d) => (d.id === id ? { ...d, ...p } : d)) }),
      deleteDesign: (id) => set({ designs: get().designs.filter((d) => d.id !== id) }),
      createProject: (p) => {
        const id = uid();
        const now = new Date().toISOString();
        const project: Project = {
          ...p,
          id,
          createdAt: now,
          status: 'active',
          messages: [
            { id: uid(), from: 'vendor', text: `Assalam-o-Alaikum! Thank you for booking "${p.title}". Your first milestone is safely in escrow — I'll confirm the site visit time shortly.`, at: now },
          ],
        };
        set({ projects: [project, ...get().projects] });
        return id;
      },
      depositMilestone: (projectId, milestoneId) =>
        set({
          projects: mapProject(get().projects, projectId, (p) => ({
            ...p,
            milestones: p.milestones.map((m) => (m.id === milestoneId ? { ...m, status: 'in_escrow' } : m)),
          })),
        }),
      releaseMilestone: (projectId, milestoneId) =>
        set({
          projects: mapProject(get().projects, projectId, (p) => {
            const milestones = p.milestones.map((m) => (m.id === milestoneId ? { ...m, status: 'released' as const } : m));
            const done = milestones.every((m) => m.status === 'released');
            return { ...p, milestones, status: done ? 'completed' : 'active' };
          }),
        }),
      addMessage: (projectId, m) =>
        set({
          projects: mapProject(get().projects, projectId, (p) => ({
            ...p,
            messages: [...p.messages, { ...m, id: uid(), at: new Date().toISOString() }],
          })),
        }),
      rateProject: (projectId, rating, review) =>
        set({ projects: mapProject(get().projects, projectId, (p) => ({ ...p, rating, review })) }),
      submitVendorApplication: (a) => set({ vendorApplication: { ...a, submittedAt: new Date().toISOString(), step: 1 } }),
      markReferralUsed: () => set({ referralUsed: true }),
      claimStudentPack: () => set({ studentPackClaimed: true }),
      resetAll: () => set({ ...initial, hydrated: true, draft: emptyDraft() }),
    }),
    {
      name: 'rennovaai-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        useApp.setState({ hydrated: true });
      },
    },
  ),
);
