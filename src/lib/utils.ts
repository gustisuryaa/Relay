import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Computes a position value for inserting an item between two neighbors in
 * a drag-and-drop list, without ever renumbering the rest of the list.
 *
 * Example: dragging a task between position 1 and position 2 gives it
 * position 1.5. Dragging to the very top of an empty gap before position 1
 * gives it 0.5. This is the "fractional indexing" trick — see
 * prisma/schema.prisma for why Task.position is a Float.
 */
export function positionBetween(prev: number | null, next: number | null): number {
  if (prev === null && next === null) return 1000;
  if (prev === null) return next! / 2;
  if (next === null) return prev + 1000;
  return (prev + next) / 2;
}
