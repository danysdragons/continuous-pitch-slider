import test from 'node:test';
import assert from 'node:assert/strict';
import { NOTES, midiToFrequency, noteName, selectedPitch } from '../src/pitch.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test('offers all 37 chromatic notes from C2 to C5, tuned to A4 = 440 Hz', () => {
  assert.equal(NOTES.length, 37);
  assert.equal(NOTES[0].name, 'C2');
  assert.equal(NOTES.at(-1).name, 'C5');
  assert.equal(midiToFrequency(69), 440);
  close(NOTES[0].frequency, 65.40639132514966);
  close(NOTES.at(-1).frequency, 523.2511306011972);
});

test('continuous pitch uses logarithmic frequency interpolation', () => {
  close(selectedPitch(48, 60, 50).frequency, Math.sqrt(midiToFrequency(48) * midiToFrequency(60)));
  assert.equal(selectedPitch(48, 49, 57).frequency.toFixed(1), '135.2');
  assert.equal(selectedPitch(48, 49, 57).name, 'C#3');
});

test('endpoints work in ascending and descending ranges', () => {
  for (const [start, end] of [[36, 72], [72, 36]]) {
    close(selectedPitch(start, end, 0).frequency, midiToFrequency(start));
    close(selectedPitch(start, end, 100).frequency, midiToFrequency(end));
    close(selectedPitch(start, end, 50).frequency, midiToFrequency(54));
  }
});

test('identical endpoints hold one note at every position, with or without snapping', () => {
  for (const snap of [false, true]) {
    for (const position of [0, 17, 50, 99, 100]) {
      close(selectedPitch(48, 48, position, snap).frequency, midiToFrequency(48));
    }
  }
});

test('snapping always selects the nearest semitone inside either range direction', () => {
  for (const [start, end] of [[36, 72], [72, 36], [48, 49], [49, 48]]) {
    for (let position = 0; position <= 100; position += 0.25) {
      const { midi, frequency } = selectedPitch(start, end, position, true);
      assert.equal(midi, Math.round(start + (end - start) * position / 100));
      assert.ok(midi >= Math.min(start, end) && midi <= Math.max(start, end));
      close(frequency, midiToFrequency(midi));
    }
  }
});

test('continuous mode is the default and does not quantize fractional pitches', () => {
  assert.equal(selectedPitch(48, 49, 40).midi, 48.4);
  assert.equal(selectedPitch(48, 49, 40, true).midi, 48);
});

test('position is clamped to the selected range and note names cross octaves correctly', () => {
  assert.equal(selectedPitch(48, 60, -100).midi, 48);
  assert.equal(selectedPitch(48, 60, 200).midi, 60);
  assert.equal(noteName(59.6), 'C4');
});
