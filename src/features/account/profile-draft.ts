// A minimal, per-tab timezone draft supports reauthentication without storing account records/tokens.
const key = 'closet-theory.account-profile-draft';
export function readProfileDraft(owner: string): string | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (
      value.owner === owner &&
      typeof value.timezone === 'string' &&
      value.timezone.length <= 100
    )
      return value.timezone;
    sessionStorage.removeItem(key);
  } catch {
    /* The active form still keeps its in-memory value. */
  }
  return null;
}
export function saveProfileDraft(owner: string, timezone: string) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ owner, timezone }));
    return true;
  } catch {
    return false;
  }
}
export function clearProfileDraft() {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Never block sign-out on browser storage. */
  }
}
