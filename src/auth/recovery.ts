import { create } from 'zustand';

/**
 * Set while the user is signed in through a password-reset link, so the app sends them to
 * "Set new password" (app/auth/reset-password.tsx) instead of their usual home screen.
 */
export const useRecovery = create<{ active: boolean; setActive: (active: boolean) => void }>((set) => ({
  active: false,
  setActive: (active) => set({ active }),
}));
