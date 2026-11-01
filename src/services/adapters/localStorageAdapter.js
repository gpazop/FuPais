// ========================================================
// FUPAIS — localStorage ADAPTER
// Implements the storage port over window.localStorage.
// Stores raw strings only; JSON serialization belongs to the port.
// Never throws: a full quota, a disabled storage or private mode must not
// break the UI.
// ========================================================

const getStore = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    // Accessing localStorage can throw when cookies/storage are blocked.
    return null;
  }
};

export const localStorageAdapter = {
  async get(key) {
    const store = getStore();
    if (!store) return null;

    try {
      return store.getItem(key);
    } catch (e) {
      console.warn(`No se pudo cargar "${key}" desde localStorage:`, e);
      return null;
    }
  },

  async set(key, value) {
    const store = getStore();
    if (!store) return;

    try {
      store.setItem(key, value);
    } catch (e) {
      console.warn(`No se pudo guardar "${key}" en localStorage:`, e);
    }
  },

  async remove(key) {
    const store = getStore();
    if (!store) return;

    try {
      store.removeItem(key);
    } catch (e) {
      console.warn(`No se pudo eliminar "${key}" de localStorage:`, e);
    }
  }
};
