import type { TrackEditMask } from '../types/player';

/** uint8 bitmask. bit N = track N is in edit focus. */
export const trackMask = (index: number): TrackEditMask => 1 << index;

export const isTrackInMask = (mask: TrackEditMask, index: number): boolean =>
  (mask & trackMask(index)) !== 0;

export const setTrackInMask = (
  mask: TrackEditMask,
  index: number,
  on: boolean
): TrackEditMask =>
  on ? (mask | trackMask(index)) : (mask & ~trackMask(index));

/** Studio exclusive 1-bit display. Returns undefined when mask has no set bits. */
export const primaryTrackIndex = (mask: TrackEditMask): number | undefined => {
  if (mask === 0) return undefined;
  return Math.log2(mask & -mask) | 0;
};
