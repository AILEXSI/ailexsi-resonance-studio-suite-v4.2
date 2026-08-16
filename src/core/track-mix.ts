import type { Track } from "./models";

/** Mute always hides the track. Solo (if any peer is soloed) is preview-only. */
export function isTrackActiveForPreview(tracks: Track[], track: Track): boolean {
  if (track.muted) return false;
  const peers = tracks.filter((t) => t.kind === track.kind);
  const anySolo = peers.some((t) => t.soloed);
  if (anySolo) return !!track.soloed;
  return true;
}

/** Solo does not affect export — only Mute does. */
export function isTrackActiveForExport(track: Track): boolean {
  return !track.muted;
}

export function toggleTrackMute(tracks: Track[], trackId: string): Track[] {
  return tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t));
}

export function toggleTrackSolo(tracks: Track[], trackId: string): Track[] {
  return tracks.map((t) => (t.id === trackId ? { ...t, soloed: !t.soloed } : t));
}
