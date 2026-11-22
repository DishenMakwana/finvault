import { CacheItem } from "@/types/settings.types";

const memoryStore = new Map<string, CacheItem<any>>();

export function cacheGet<T>(key: string): T | null {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return item.value as T;
}

export function cacheSet<T>(
  key: string,
  value: T,
  ttlMs = 60000,
  tags: string[] = []
): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
    tags,
  });
}

export function cacheInvalidateTag(tag: string): void {
  for (const [key, item] of memoryStore.entries()) {
    if (item.tags.includes(tag)) {
      memoryStore.delete(key);
    }
  }
}
