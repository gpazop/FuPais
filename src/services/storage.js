// ========================================================
// FUPAIS — STORAGE PORT
// The single boundary between the app and any persistence backend.
//
// Contract (async on purpose: localStorage is sync, Supabase/HTTP is not):
//   storage.get(key, fallback) -> parsed value | fallback
//   storage.set(key, value)    -> void
//   storage.remove(key)        -> void
//
// Call sites must never touch localStorage directly. To move to a backend,
// write another adapter and call setStorageAdapter(); no UI code changes.
// ========================================================

import { localStorageAdapter } from "./adapters/localStorageAdapter.js";

let currentAdapter = localStorageAdapter;

/**
 * Swap the persistence backend (e.g. an ApiAdapter once the backend exists).
 * @param {{get: Function, set: Function, remove: Function}} adapter
 */
export function setStorageAdapter(adapter) {
  if (!adapter || typeof adapter.get !== "function" || typeof adapter.set !== "function") {
    throw new TypeError("El adaptador debe implementar get(key) y set(key, value).");
  }
  currentAdapter = adapter;
}

export function getStorageAdapter() {
  return currentAdapter;
}

export const storage = {
  async get(key, fallback = null) {
    const raw = await currentAdapter.get(key);
    if (raw === null || raw === undefined) return fallback;

    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`No se pudo leer "${key}" del almacenamiento:`, e);
      return fallback;
    }
  },

  async set(key, value) {
    await currentAdapter.set(key, JSON.stringify(value));
  },

  async remove(key) {
    if (typeof currentAdapter.remove !== "function") return;
    await currentAdapter.remove(key);
  }
};
