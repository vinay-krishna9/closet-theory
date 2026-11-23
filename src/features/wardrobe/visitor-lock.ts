export function withVisitorLock<T>(action: () => T): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks)
    return navigator.locks.request('closet-theory.visitor-source', action);
  // Existing visitor-only use remains available without Web Locks. Import
  // requires them before clearing shared source across multiple browser tabs.
  try {
    return Promise.resolve(action());
  } catch (error) {
    return Promise.reject(error);
  }
}
