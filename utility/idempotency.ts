import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const BASE_STORAGE_KEY = '@fitfob_membership_idempotency_key';

interface StoredIdempotencyData {
  key: string;
  createdAt: number;
}

/**
 * Generates an RFC4122 v4 UUID (e.g. "550e8400-e29b-41d4-a716-446655440000")
 */
export const generateUUID = (): string => {
  try {
    if (typeof Crypto.randomUUID === 'function') {
      return Crypto.randomUUID();
    }
  } catch (error) {
    console.warn('Crypto.randomUUID unavailable, using RFC4122 v4 fallback:', error);
  }

  // RFC4122 version 4 compliant fallback generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Returns the storage key for a specific plan or default
 */
const getStorageKey = (planRateId?: string): string => {
  return planRateId ? `${BASE_STORAGE_KEY}_${planRateId}` : BASE_STORAGE_KEY;
};

/**
 * Gets the current valid idempotency key from local storage (if within 5 mins),
 * or generates a new RFC4122 UUID v4 key, stores it locally for 5 mins, and returns it.
 */
export const getOrGenerateIdempotencyKey = async (planRateId?: string): Promise<string> => {
  const storageKey = getStorageKey(planRateId);

  try {
    const rawData = await AsyncStorage.getItem(storageKey);
    if (rawData) {
      const parsed: StoredIdempotencyData = JSON.parse(rawData);
      const age = Date.now() - parsed.createdAt;
      if (parsed.key && age < FIVE_MINUTES_MS) {
        const remainingSec = Math.round((FIVE_MINUTES_MS - age) / 1000);
        console.log(`🔑 Reusing existing idempotencyKey: ${parsed.key} (${remainingSec}s remaining)`);
        return parsed.key;
      }
      console.log('⌛ Idempotency key expired (> 5 min), generating a fresh key.');
    }
  } catch (err) {
    console.warn('Failed to read idempotency key from AsyncStorage:', err);
  }

  // Generate new UUID v4
  const newKey = generateUUID();
  try {
    const data: StoredIdempotencyData = {
      key: newKey,
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    console.log(`✨ Generated & stored new idempotencyKey (valid 5 min): ${newKey}`);
  } catch (err) {
    console.warn('Failed to save idempotency key to AsyncStorage:', err);
  }

  return newKey;
};

/**
 * Removes the idempotency key from local storage after successful payment
 */
export const removeIdempotencyKey = async (planRateId?: string): Promise<void> => {
  try {
    const keysToRemove = [BASE_STORAGE_KEY];
    if (planRateId) {
      keysToRemove.push(getStorageKey(planRateId));
    }
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('🗑️ Successfully removed idempotencyKey from local storage.');
  } catch (err) {
    console.warn('Failed to remove idempotency key from AsyncStorage:', err);
  }
};
