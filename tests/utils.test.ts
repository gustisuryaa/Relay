import { describe, it, expect } from 'vitest';
import { positionBetween } from '@/lib/utils';

describe('positionBetween', () => {
  it('returns a default position when the list is empty', () => {
    expect(positionBetween(null, null)).toBe(1000);
  });

  it('places an item before the first existing item', () => {
    const pos = positionBetween(null, 1000);
    expect(pos).toBeLessThan(1000);
    expect(pos).toBeGreaterThan(0);
  });

  it('places an item after the last existing item', () => {
    const pos = positionBetween(1000, null);
    expect(pos).toBeGreaterThan(1000);
  });

  it('places an item exactly between two neighbors', () => {
    expect(positionBetween(1000, 2000)).toBe(1500);
  });

  it('keeps producing a distinct midpoint across repeated insertions', () => {
    // Simulates dragging several cards into the same tiny gap in a row —
    // the classic stress case for fractional/lexicographic ordering.
    const prev = 1000;
    let next = 1001;
    const seen = new Set<number>();

    for (let i = 0; i < 5; i++) {
      const mid = positionBetween(prev, next);
      expect(seen.has(mid)).toBe(false);
      seen.add(mid);
      next = mid; // keep narrowing the gap
    }
  });
});
