import memCache = require("memory-cache");

export const get = (key: string): any => {
  return memCache.get(key);
};

export const set = (key: string, value: any, ttl?: number): void => {
  memCache.put(key, value, ttl);
};

export const remove = (key: string): void => {
  memCache.del(key);
};
