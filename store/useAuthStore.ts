import { storageAPI } from '@/utility/storage';
import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  email: string;
  token: string;
  name?: string;
  clientDetail?: any;
  role?: any;
  verification_status?: string;
  [key: string]: any;
}

interface AuthStore {
  user: User | null;
  isInitializing: boolean;
  setUser: (user: User | null, rememberMe?: boolean) => Promise<void>;
  logOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const STORAGE_KEY = 'authUser';

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isInitializing: true,

  setUser: async (user, rememberMe = false) => {
    set({ user });

    if (!user) {
      await storageAPI.removeItem(STORAGE_KEY);
      return;
    }

    try {
      const ttlMinutes = rememberMe ? undefined : 1440;
      await storageAPI.setItem(STORAGE_KEY, JSON.stringify(user), ttlMinutes);
    } catch (error: any) {
      console.error('Failed to save user session:', error);
    }
  },

  logOut: async () => {
    try {
      const { unregisterDeviceTokenWithBackend } = await import('@/services/notificationService');
      await unregisterDeviceTokenWithBackend();
    } catch (err) {
      console.error('Error unregistering device token on logout:', err);
    }

    try {
      await storageAPI.removeItem(STORAGE_KEY);
      set({ user: null });
    } catch (error: any) {
      set({ user: null });
      throw new Error(error.message || 'An error occurred during logout.');
    }
  },

  initializeAuth: async () => {
    try {
      set({ isInitializing: true });
      const storedUser = await storageAPI.getItem(STORAGE_KEY);

      if (storedUser) {
        const parsedUser = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
        set({ user: parsedUser });
      }
    } catch (error: any) {
      console.error('Error initializing auth session:', error);
      await storageAPI.removeItem(STORAGE_KEY);
      set({ user: null });
    } finally {
      set({ isInitializing: false });
    }
  },
}));
