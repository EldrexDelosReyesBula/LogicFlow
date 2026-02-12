const VERSION_KEY = 'lf_storage_version';
const CURRENT_VERSION = '6.0.0';

export const SafeStorage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      return JSON.parse(stored);
    } catch (e) {
      console.warn(`SafeStorage: Failed to load ${key}`, e);
      return defaultValue;
    }
  },

  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`SafeStorage: Failed to save ${key}`, e);
    }
  },

  checkVersion: () => {
    try {
      const storedVer = localStorage.getItem(VERSION_KEY);
      if (storedVer !== CURRENT_VERSION) {
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      }
    } catch (e) {
    }
  }
};
