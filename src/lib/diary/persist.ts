export const STORAGE_KEY = 'positive-possible-diary:v1';

export type PersistAdapter = {
  load(): Promise<string | null>;
  save(raw: string): Promise<void>;
  clear(): Promise<void>;
};

export function createLocalStoragePersist(
  storage: Storage = localStorage,
): PersistAdapter {
  return {
    async load() {
      try {
        return storage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    },
    async save(raw: string) {
      storage.setItem(STORAGE_KEY, raw);
    },
    async clear() {
      storage.removeItem(STORAGE_KEY);
    },
  };
}
