import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  user_id: number;
  username: string;
  access_token: string;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      isAuthenticated: () => !!get().user,
    }),
    { name: "gitlit-auth" }
  )
);
