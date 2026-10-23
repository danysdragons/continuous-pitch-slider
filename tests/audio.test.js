import test from 'node:test';
import assert from 'node:assert/strict';
import { TonePlayer } from '../src/audio.js';

function parameter() {
  return {
    value: 0, calls: [],
    setValueAtTime(...args) { this.calls.push(['set', ...args]); },
    linearRampToValueAtTime(...args) { this.calls.push(['ramp', ...args]); },
    setTargetAtTime(...args) { this.calls.push(['target', ...args]); },
    cancelAndHoldAtTime(...args) { this.calls.push(['hold', ...args]); },
  };
}

function context() {
  const nodes = [];
  const node = (properties = {}) => {
    const result = { connections: [], disconnected: false, connect(to) { this.connections.push(to); }, disconnect() { this.disconnected = true; }, ...properties };
    nodes.push(result);
    return result;
  };
  return {
    nodes, state: 'suspended', currentTime: 10, destination: {},
    addEventListener() {},
    async resume() { this.state = 'running'; },
    async close() { this.state = 'closed'; },
    createOscillator() { return node({ frequency: parameter(), startCalls: 0, start() { this.startCalls++; }, stop(time) { this.stopTime = time; } }); },
    createGain() { return node({ gain: parameter() }); },
    createDynamicsCompressor() { return node(Object.fromEntries(['threshold', 'knee', 'ratio', 'attack', 'release'].map((key) => [key, parameter()]))); },
  };
}

test('audio is lazy, resumes on Play, and connects one sustained voice through gain and compressor', async () => {
  const audio = context();
  let creations = 0;
  const player = new TonePlayer(() => { creations++; return audio; });
  assert.equal(creations, 0);
  await player.start(440, 0.9, 'sine');
  assert.equal(creations, 1);
  assert.equal(audio.state, 'running');
  const [oscillator, gain, compressor] = audio.nodes;
  assert.deepEqual(oscillator.connections, [gain]);
  assert.deepEqual(gain.connections, [compressor]);
  assert.deepEqual(compressor.connections, [audio.destination]);
  assert.equal(oscillator.startCalls, 1);
  assert.equal(oscillator.stopTime, undefined);
  assert.deepEqual(gain.gain.calls, [['set', 0, 10], ['ramp', 0.9, 10.02]]);
  await player.start(440, 0.9, 'sine');
  assert.equal(audio.nodes.length, 3);
});

test('live changes tune smoothly, switch waveform, and reach exact silence without stopping the tone', async () => {
  const audio = context();
  const player = new TonePlayer(() => audio);
  await player.start(220, 0.9, 'sine');
  player.update(440, 0, 'square');
  const { oscillator, gain } = player.voice;
  assert.deepEqual(oscillator.frequency.calls.at(-1), ['target', 440, 10, 0.008]);
  assert.equal(oscillator.type, 'square');
  assert.deepEqual(gain.gain.calls.slice(-2), [['hold', 10], ['ramp', 0, 10.02]]);
  assert.equal(oscillator.stopTime, undefined);
  player.update(440, 2.5, 'triangle');
  assert.deepEqual(gain.gain.calls.at(-1), ['ramp', 2.5, 10.02]);
});

test('Stop fades out, schedules oscillator cleanup, and allows a new voice on replay', async () => {
  const audio = context();
  const player = new TonePlayer(() => audio);
  await player.start(220, 0.9, 'sine');
  const oldVoice = player.voice;
  player.stop();
  assert.equal(player.voice, null);
  assert.deepEqual(oldVoice.gain.gain.calls.at(-1), ['ramp', 0, 10.02]);
  assert.equal(oldVoice.oscillator.stopTime, 10.03);
  oldVoice.oscillator.onended();
  assert.ok(audio.nodes.every((node) => node.disconnected));
  await player.start(330, 0.4, 'sawtooth');
  assert.notEqual(player.voice.oscillator, oldVoice.oscillator);
  assert.equal(player.voice.oscillator.type, 'sawtooth');
  await player.dispose();
  assert.equal(player.voice, null);
  assert.equal(audio.state, 'closed');
});

test('a failed browser resume produces an actionable error without creating an oscillator', async () => {
  const audio = context();
  audio.resume = async () => {};
  const player = new TonePlayer(() => audio);
  await assert.rejects(() => player.start(440, 0.9, 'sine'), /Audio could not start/);
  assert.equal(player.voice, null);
  assert.equal(audio.nodes.length, 0);
});

test('updates and stop before Play are harmless; disposed contexts can be recreated', async () => {
  const player = new TonePlayer(context);
  player.update(440, 1, 'sine');
  player.stop();
  await player.start(440, 1, 'sine');
  const previous = player.context;
  await player.dispose();
  await player.start(440, 1, 'sine');
  assert.notEqual(player.context, previous);
});
