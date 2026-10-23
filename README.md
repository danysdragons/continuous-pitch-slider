# Continuous Pitch Slider

[Open the app](https://danysdragons.github.io/continuous-pitch-slider/)

A small, dependency-free Web Audio instrument. Choose two notes from **C2 to C5** and sweep continuously between them, hold a tone, change its waveform, or snap to equal-tempered semitones.

- Continuous logarithmic pitch interpolation, including descending and identical-note ranges.
- Prominent start, end, and selected frequencies with nearest note names (A4 = 440 Hz).
- Sine, square, sawtooth, and triangle waveforms; changes apply while playing.
- Volume from exact silence to **2.5×**, initially **0.90×**, with a compressor to control boosted peaks.
- Material dark, Solarized dark, Solarized light, Midnight neon, and Paper light themes. The selected theme is remembered locally.
- Vertically stacked, responsive cards, visible filled sliders, and native keyboard controls.

Audio begins only when you press **Play tone** and continues until you press **Stop tone** or leave the page. The pitch slider supports arrow keys and Home/End. A zero volume setting mutes the signal while keeping the oscillator running.

## Run locally

Requires Node.js 22 or newer. There are no packages to install.

```sh
npm run dev
```

Open <http://127.0.0.1:5173>. Set `PORT` to use another port.

```sh
npm test
npm run build
```

The build copies only the app's public assets into `dist/`. All asset URLs are relative, so it works under a GitHub Pages repository path.

## Deployment

The GitHub Actions workflow at `.github/workflows/pages.yml` tests, builds, and deploys **every push to `main`**. It can also be run manually from the Actions tab. Pages uses **GitHub Actions** as its build source; no deploy token or third-party service is required.

```sh
git add .
git commit -m "Describe your change"
git push
```

## Source provenance

This is a recreation of the app described in the [shared ChatGPT conversation](https://chatgpt.com/share/6adabe7a-b37c-83ea-a936-2f4d80cef508), using the supplied screenshot as a visual reference. The accessible transcript included CSS excerpts and feature descriptions but did not expose the original Canvas source artifact. The final feature requests in that transcript (including stacked cards, five themes, waveform selection, snapping, and boosted volume) are included here.

The application uses plain HTML, CSS, and JavaScript ES modules. `src/pitch.js` handles musical calculations, `src/audio.js` owns the audio lifecycle, and `src/app.js` connects controls and readouts.
