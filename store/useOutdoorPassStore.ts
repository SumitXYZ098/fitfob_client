import { create } from 'zustand';

export interface OutdoorPassData {
  id: string;
  passName: string; // e.g. "Premium Outdoor Pass"
  tierId: 'basic' | 'premium' | 'luxury';
  visits: number;
  totalVisits: number;
  expiresOn: string;
  price: number;
  location: string;
  isPaused: boolean;
  purchasedAt: string;
}

interface OutdoorPassStore {
  activePass: OutdoorPassData | null;
  historyPasses: OutdoorPassData[];
  setActivePass: (pass: OutdoorPassData | null) => void;
  togglePausePass: () => void;
  useVisit: () => void;
}

export const useOutdoorPassStore = create<OutdoorPassStore>((set) => ({
  activePass: {
    id: '123-456-789',
    passName: 'Premium Outdoor Pass',
    tierId: 'premium',
    visits: 7,
    totalVisits: 7,
    expiresOn: '02/02/2026',
    price: 2199,
    location: 'Sector 71',
    isPaused: false,
    purchasedAt: new Date().toISOString(),
  },
  historyPasses: [],

  setActivePass: (pass) => set({ activePass: pass }),

  togglePausePass: () =>
    set((state) => ({
      activePass: state.activePass
        ? { ...state.activePass, isPaused: !state.activePass.isPaused }
        : null,
    })),

  useVisit: () =>
    set((state) => {
      if (!state.activePass || state.activePass.visits <= 0) return state;
      const updatedVisits = state.activePass.visits - 1;
      return {
        activePass: { ...state.activePass, visits: updatedVisits },
      };
    }),
}));
