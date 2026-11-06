export const isBrowser = typeof window !== 'undefined';

export const storage = {
  getItem(key) {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key, value) {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem(key) {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  }
};

