import { HistoryItem } from '../types';

export const DB_NAME = 'LogicFlowDB';
export const STORE_NAME = 'history';
export const DB_VERSION = 1;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveHistory = async (item: HistoryItem) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp));
        request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return [];
  }
};

export const clearHistory = async () => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
    } catch (e) {
        console.error(e);
    }
};
