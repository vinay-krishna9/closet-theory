import { compareIds } from './identity';
import { engineDefaults } from './rules';
import type { ScoredCandidate } from './types';

const preferenceOrder = { favorite: 0, neutral: 1, disliked: 2 };

export function compareCandidates(
  left: ScoredCandidate,
  right: ScoredCandidate,
): number {
  return (
    preferenceOrder[left.candidate.preference] -
      preferenceOrder[right.candidate.preference] ||
    right.style + right.freshness - (left.style + left.freshness) ||
    compareIds(left.candidate.id, right.candidate.id)
  );
}

function countFor(counts: Map<string, number>, id: string): number {
  return counts.get(id) ?? 0;
}

function addUse(counts: Map<string, number>, id: string, amount: number) {
  const next = countFor(counts, id) + amount;
  if (next === 0) counts.delete(id);
  else counts.set(id, next);
}

// Retention is bounded independently of the Cartesian product size.
export class CandidatePool {
  readonly candidates: ScoredCandidate[] = [];
  truncated = false;
  private readonly ids = new Set<string>();
  private readonly tops = new Map<string, number>();
  private readonly bottoms = new Map<string, number>();

  constructor(private readonly capacity: number) {}

  add(candidate: ScoredCandidate) {
    if (this.ids.has(candidate.candidate.id)) return;
    this.candidates.push(candidate);
    this.track(candidate, 1);
    if (this.candidates.length <= this.capacity) return;
    this.truncated = true;
    let worst = 0;
    for (let index = 1; index < this.candidates.length; index++) {
      if (compareCandidates(this.candidates[index], this.candidates[worst]) > 0)
        worst = index;
    }
    const lowest = this.candidates[worst];
    for (let index = 0; index < this.candidates.length; index++) {
      const value = this.candidates[index];
      if (
        value.candidate.preference !== lowest.candidate.preference ||
        Math.abs(value.style - lowest.style) > engineDefaults.diversityWindow
      )
        continue;
      const previous = this.candidates[worst];
      const topDifference =
        countFor(this.tops, value.candidate.slots.top) -
        countFor(this.tops, previous.candidate.slots.top);
      const bottomDifference =
        countFor(this.bottoms, value.candidate.slots.bottom) -
        countFor(this.bottoms, previous.candidate.slots.bottom);
      if (
        topDifference > 0 ||
        (topDifference === 0 &&
          (bottomDifference > 0 ||
            (bottomDifference === 0 && compareCandidates(value, previous) > 0)))
      )
        worst = index;
    }
    const [removed] = this.candidates.splice(worst, 1);
    this.track(removed, -1);
  }

  private track(value: ScoredCandidate, amount: number) {
    const candidate = value.candidate;
    if (amount > 0) this.ids.add(candidate.id);
    else this.ids.delete(candidate.id);
    addUse(this.tops, candidate.slots.top, amount);
    addUse(this.bottoms, candidate.slots.bottom, amount);
  }
}

export function rankCandidates(
  candidates: readonly ScoredCandidate[],
): ScoredCandidate[] {
  const remaining = [...candidates].sort(compareCandidates);
  const ordered: ScoredCandidate[] = [];
  const tops = new Map<string, number>();
  const bottoms = new Map<string, number>();
  let previousGroup: string | undefined;
  while (remaining.length) {
    const best = remaining[0];
    if (best.candidate.preference !== previousGroup) {
      tops.clear();
      bottoms.clear();
      previousGroup = best.candidate.preference;
    }
    let selected = 0;
    for (let index = 1; index < remaining.length; index++) {
      const value = remaining[index];
      if (value.candidate.preference !== best.candidate.preference) break;
      if (Math.abs(value.style - best.style) > engineDefaults.diversityWindow)
        continue;
      const current = remaining[selected];
      const topDifference =
        countFor(tops, value.candidate.slots.top) -
        countFor(tops, current.candidate.slots.top);
      const bottomDifference =
        countFor(bottoms, value.candidate.slots.bottom) -
        countFor(bottoms, current.candidate.slots.bottom);
      if (topDifference < 0 || (topDifference === 0 && bottomDifference < 0))
        selected = index;
    }
    const [next] = remaining.splice(selected, 1);
    ordered.push(next);
    addUse(tops, next.candidate.slots.top, 1);
    addUse(bottoms, next.candidate.slots.bottom, 1);
  }
  return ordered;
}
