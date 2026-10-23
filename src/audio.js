// Audio starts only after an explicit Play gesture. One oscillator is held until Stop.
export class TonePlayer {
  constructor(createContext = () => {
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) throw new Error('This browser does not support Web Audio. Try a current version of Safari, Chrome, or Firefox.');
    return new AudioContext();
  }) {
    this.createContext = createContext;
    this.context = null;
    this.voice = null;
    this.onStateChange = () => {};
  }

  async start(frequency, volume, waveform) {
    if (!this.context || this.context.state === 'closed') {
      this.context = this.createContext();
      this.context.addEventListener('statechange', () => this.onStateChange());
    }
    await this.context.resume();
    if (this.context.state !== 'running') throw new Error('Audio could not start. Press Play to try again.');
    if (this.voice) return;
    const context = this.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const compressor = context.createDynamicsCompressor();
    // Keep boosted signals close to full scale instead of hard-clipping the output.
    compressor.threshold.value = -3;
    compressor.knee.value = 0;
    compressor.ratio.value = 20;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.02);
    oscillator.connect(gain);
    gain.connect(compressor);
    compressor.connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      compressor.disconnect();
    };
    oscillator.start();
    this.voice = { oscillator, gain };
    this.onStateChange();
  }

  update(frequency, volume, waveform) {
    if (!this.voice) return;
    const now = this.context.currentTime;
    this.voice.oscillator.frequency.setTargetAtTime(frequency, now, 0.008);
    this.voice.oscillator.type = waveform;
    const parameter = this.voice.gain.gain;
    parameter.cancelAndHoldAtTime(now);
    // Linear ramps reach exactly zero, so zero volume is true silence.
    parameter.linearRampToValueAtTime(volume, now + 0.02);
  }

  stop() {
    if (!this.voice) return;
    const { oscillator, gain } = this.voice;
    const now = this.context.currentTime;
    gain.gain.cancelAndHoldAtTime(now);
    gain.gain.linearRampToValueAtTime(0, now + 0.02);
    oscillator.stop(now + 0.03);
    this.voice = null;
    this.onStateChange();
  }

  async dispose() {
    this.stop();
    if (this.context && this.context.state !== 'closed') await this.context.close();
  }
}
