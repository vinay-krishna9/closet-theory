export function compareIds(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function outfitIdentity(itemIds: readonly string[]): string {
  return JSON.stringify([...itemIds].sort(compareIds));
}
