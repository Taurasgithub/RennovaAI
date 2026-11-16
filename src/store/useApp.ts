import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DesignChoices, Estimate } from '../lib/estimate';
import type { BudgetRange } from '../lib/supabase';
import { uid } from '../lib/id';
import { dropAllImages, dropImage } from '../lib/images';
import { appStorage } from '../lib/storage';
import type { ServiceType } from '../data/catalog';

/** The signed-in person's profile as the customer screens see it (mirrors public.profiles when accounts are on). */
export type User = {
  name: string;
  phone: string;
  city: string;
  avatarUri?: string | null;
  bio?: string;
  area?: string;
  preferredStyles?: string[];
  budget?: BudgetRange | null;
};

export type Language = 'en' | 'ur';

export type ResultMode = 'ai' | 'preview' | 'illustration';

export type Design = {
  id: string;
  name: string;
  /** Set for auto-generated names so they can be shown in the active language. */
  nameParts?: { styleId: string; roomTypeId: string; n: number };
  createdAt: string;
  choices: DesignChoices;
  photoUri: string | null; // null = sample room illustration
  resultUri: string | null; // AI-rendered image (data URI or remote URL)
  resultMode: ResultMode;
  regenerations: number;
  premium: boolean;
  estimate: Estimate;
  /** Set once the design is saved to the account (services/designSync.ts): which local images were uploaded, and where. */
  remote?: { photoPath: string | null; resultPath: string | null; photoUri: string | null; resultUri: string | null };
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
  language: Language;
  user: User | null;
  draft: Draft;
  designs: Design[];
  vendorApplication: VendorApplication | null;
  studentPackClaimed: boolean;
};

type Actions = {
  setUser: (u: User) => void;
  completeOnboarding: () => void;
  setLanguage: (l: Language) => void;
  updateDraft: (p: Partial<Draft>) => void;
  resetDraft: () => void;
  saveDesign: (d: Omit<Design, 'id' | 'createdAt'>) => string;
  updateDesign: (id: string, p: Partial<Design>) => void;
  deleteDesign: (id: string) => void;
  /** Adds designs restored from the account (newest first overall). */
  addDesigns: (d: Design[]) => void;
  submitVendorApplication: (a: Omit<VendorApplication, 'submittedAt' | 'step'>) => void;
  claimStudentPack: () => void;
  resetAll: () => void;
};

const initial: State = {
  hydrated: false,
  onboarded: false,
  language: 'en',
  user: null,
  draft: emptyDraft(),
  designs: [],
  vendorApplication: null,
  studentPackClaimed: false,
};

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      setUser: (user) => set({ user }),
      completeOnboarding: () => set({ onboarded: true }),
      setLanguage: (language) => set({ language }),
      updateDraft: (p) => set({ draft: { ...get().draft, ...p } }),
      resetDraft: () => set({ draft: emptyDraft() }),
      saveDesign: (d) => {
        const id = uid();
        set({ designs: [{ ...d, id, createdAt: new Date().toISOString() }, ...get().designs] });
        return id;
      },
      updateDesign: (id, p) => set({ designs: get().designs.map((d) => (d.id === id ? { ...d, ...p } : d)) }),
      deleteDesign: (id) => {
        const gone = get().designs.find((d) => d.id === id);
        set({ designs: get().designs.filter((d) => d.id !== id) });
        dropImage(gone?.photoUri);
        dropImage(gone?.resultUri);
      },
      addDesigns: (list) =>
        set({ designs: [...get().designs, ...list.filter((d) => !get().designs.some((x) => x.id === d.id))].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }),
      submitVendorApplication: (a) => set({ vendorApplication: { ...a, submittedAt: new Date().toISOString(), step: 1 } }),
      claimStudentPack: () => set({ studentPackClaimed: true }),
      resetAll: () => {
        set({ ...initial, hydrated: true, draft: emptyDraft() });
        dropAllImages();
      },
    }),
    {
      name: 'rennovaai-store-v1',
      storage: createJSONStorage(() => appStorage),
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        useApp.setState({ hydrated: true });
      },
    },
  ),
);
