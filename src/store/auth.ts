import { create } from "zustand";
import type { User } from "../types";
export const useAuth = create<{
  user: User | null;
  token: string | null;
  ready: boolean;
  setSession: (s: { user: User; accessToken: string }) => void;
  clear: () => void;
  setReady: () => void;
}>((set) => ({
  user: null,
  token: null,
  ready: false,
  setSession: (s) => set({ user: s.user, token: s.accessToken, ready: true }),
  clear: () => set({ user: null, token: null, ready: true }),
  setReady: () => set({ ready: true }),
}));
