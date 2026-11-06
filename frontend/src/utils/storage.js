export const isBrowser = typeof window !== 'undefined';

export const storage = {
  getItem(key) {
    if (!isBrowser) return null;
    try {
      // User authentication session is strictly per browser session
      if (key === 'aromapos_current_user' || key === 'aromapos_authenticated') {
        return window.sessionStorage.getItem(key);
      }
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key, value) {
    if (!isBrowser) return;
    try {
      if (key === 'aromapos_current_user' || key === 'aromapos_authenticated') {
        window.sessionStorage.setItem(key, value);
        return;
      }
      window.localStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem(key) {
    if (!isBrowser) return;
    try {
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(key);
    } catch (e) {}
  }
};

