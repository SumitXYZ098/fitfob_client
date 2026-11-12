import { create } from 'zustand';
import { storageAPI } from '@/utility/storage';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationState {
  coords: LocationCoordinates;
  city: string;
  searchRadius: number;
  isLocationSet: boolean;
  setLocation: (data: {
    latitude?: number;
    longitude?: number;
    city?: string;
    searchRadius?: number;
  }) => void;
  setCoords: (coords: LocationCoordinates) => void;
  setCity: (city: string) => void;
  setSearchRadius: (radius: number) => void;
  setIsLocationSet: (isSet: boolean) => void;
  initializeLocation: () => Promise<void>;
}

const DEFAULT_COORDS: LocationCoordinates = {
  latitude: 30.832111611338167,
  longitude: 76.6873704048281,
};

const LOCATION_STORAGE_KEY = 'user_selected_location';

export const useLocationStore = create<LocationState>((set) => ({
  coords: DEFAULT_COORDS,
  city: 'mohali',
  searchRadius: 5,
  isLocationSet: false,

  setLocation: (data) => {
    set((state) => {
      const nextCoords =
        data.latitude !== undefined && data.longitude !== undefined
          ? { latitude: data.latitude, longitude: data.longitude }
          : state.coords;
      const nextCity = data.city !== undefined ? data.city : state.city;
      const nextRadius =
        data.searchRadius !== undefined ? data.searchRadius : state.searchRadius;

      const updated = {
        coords: nextCoords,
        city: nextCity,
        searchRadius: nextRadius,
        isLocationSet: true,
      };

      storageAPI
        .setItem(
          LOCATION_STORAGE_KEY,
          JSON.stringify({
            coords: nextCoords,
            city: nextCity,
            searchRadius: nextRadius,
          })
        )
        .catch(() => {});

      return updated;
    });
  },

  setCoords: (coords) => {
    set((state) => {
      const updated = { ...state, coords, isLocationSet: true };
      storageAPI
        .setItem(
          LOCATION_STORAGE_KEY,
          JSON.stringify({
            coords,
            city: state.city,
            searchRadius: state.searchRadius,
          })
        )
        .catch(() => {});
      return updated;
    });
  },

  setCity: (city) => {
    set((state) => {
      const updated = { ...state, city, isLocationSet: true };
      storageAPI
        .setItem(
          LOCATION_STORAGE_KEY,
          JSON.stringify({
            coords: state.coords,
            city,
            searchRadius: state.searchRadius,
          })
        )
        .catch(() => {});
      return updated;
    });
  },

  setSearchRadius: (searchRadius) => {
    set((state) => {
      const updated = { ...state, searchRadius };
      storageAPI
        .setItem(
          LOCATION_STORAGE_KEY,
          JSON.stringify({
            coords: state.coords,
            city: state.city,
            searchRadius,
          })
        )
        .catch(() => {});
      return updated;
    });
  },

  setIsLocationSet: (isLocationSet) => set({ isLocationSet }),

  initializeLocation: async () => {
    try {
      const saved = await storageAPI.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.coords?.latitude && parsed?.coords?.longitude) {
          set({
            coords: parsed.coords,
            city: parsed.city ?? 'mohali',
            searchRadius: parsed.searchRadius ?? 5,
            isLocationSet: true,
          });
        }
      }
    } catch {}
  },
}));
