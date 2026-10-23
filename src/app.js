import { NOTES, midiToFrequency, noteName, selectedPitch } from './pitch.js';
import { TonePlayer } from './audio.js';

const byId = (id) => document.getElementById(id);
const start = byId('start-note');
const end = byId('end-note');
const pitch = byId('pitch');
const volume = byId('volume');
const waveform = byId('waveform');
const snap = byId('snap');
const theme = byId('theme');
const play = byId('play');
const player = new TonePlayer();
let starting = false;

for (const select of [start, end]) {
  for (const note of NOTES) select.add(new Option(note.name, String(note.midi)));
}
start.value = '48';
end.value = '49';

try {
  const stored = localStorage.getItem('pitch-slider-theme');
  if ([...theme.options].some((option) => option.value === stored)) theme.value = stored;
} catch { /* Private browsing may disable storage; themes still work for this visit. */ }
document.body.dataset.theme = theme.value;

function currentPitch() {
  return selectedPitch(Number(start.value), Number(end.value), Number(pitch.value), snap.checked);
}

function updatePlayback() {
  const active = Boolean(player.voice);
  const running = active && player.context.state === 'running';
  play.setAttribute('aria-pressed', String(active));
  play.textContent = active ? 'Stop tone' : 'Play tone';
  byId('playback-status').classList.toggle('playing', running);
  byId('status-text').textContent = active ? (running ? 'Playing' : 'Audio paused') : 'Stopped';
}
player.onStateChange = updatePlayback;

function render() {
  const selected = currentPitch();
  const format = (frequency) => `${frequency.toFixed(1)} Hz`;
  byId('start-frequency').value = format(midiToFrequency(Number(start.value)));
  byId('end-frequency').value = format(midiToFrequency(Number(end.value)));
  byId('selected-frequency').value = format(selected.frequency);
  byId('start-name').textContent = `(${noteName(Number(start.value))})`;
  byId('end-name').textContent = `(${noteName(Number(end.value))})`;
  byId('selected-name').textContent = `(${selected.name})`;
  byId('pitch-position').value = `${Math.round(Number(pitch.value))}%`;
  byId('volume-value').value = `${Number(volume.value).toFixed(2)}×`;
  pitch.style.setProperty('--progress', `${pitch.value}%`);
  volume.style.setProperty('--progress', `${Number(volume.value) / 2.5 * 100}%`);
  pitch.setAttribute('aria-valuetext', `${format(selected.frequency)}, ${selected.name}${snap.checked ? ', snapped to semitone' : ', continuous'}`);
  volume.setAttribute('aria-valuetext', Number(volume.value) === 0 ? 'Silent' : `${Number(volume.value).toFixed(2)} times full level`);
  player.update(selected.frequency, Number(volume.value), waveform.value);
}

for (const control of [start, end, pitch, volume, waveform, snap]) control.addEventListener('input', render);
theme.addEventListener('change', () => {
  document.body.dataset.theme = theme.value;
  try { localStorage.setItem('pitch-slider-theme', theme.value); } catch { /* Optional storage. */ }
});

play.addEventListener('click', async () => {
  if (starting) return;
  byId('audio-error').hidden = true;
  if (player.voice) {
    player.stop();
    return;
  }
  starting = true;
  play.disabled = true;
  try {
    await player.start(currentPitch().frequency, Number(volume.value), waveform.value);
    // Controls may have changed while the browser was resuming its audio context.
    render();
  } catch (error) {
    player.stop();
    byId('audio-error').textContent = `Unable to play audio. ${error.message}`;
    byId('audio-error').hidden = false;
  } finally {
    starting = false;
    play.disabled = false;
    updatePlayback();
  }
});

window.addEventListener('pagehide', () => { void player.dispose(); });
render();
updatePlayback();
