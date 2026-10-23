const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function noteName(midi) {
  const rounded = Math.round(midi);
  return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${Math.floor(rounded / 12) - 1}`;
}

export const NOTES = Array.from({ length: 37 }, (_, index) => {
  const midi = 36 + index;
  return { midi, name: noteName(midi), frequency: midiToFrequency(midi) };
});

export function selectedPitch(start, end, position, snap = false) {
  const fraction = Math.min(1, Math.max(0, position / 100));
  const continuousMidi = start + (end - start) * fraction;
  const midi = snap ? Math.round(continuousMidi) : continuousMidi;
  return { midi, frequency: midiToFrequency(midi), name: noteName(midi) };
}
