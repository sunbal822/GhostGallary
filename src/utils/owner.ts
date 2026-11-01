// Anonymous per-browser id so ghosts you make stay private to you unless you share them.
export function getOwnerId(): string {
  try {
    let id = localStorage.getItem('ghost-owner');
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem('ghost-owner', id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}
