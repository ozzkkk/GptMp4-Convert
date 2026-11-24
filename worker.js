// Same-origin worker entry point for FFmpeg.wasm.
// The browser creates this worker from GitHub Pages origin; the official worker
// module and its relative dependencies are then imported from jsDelivr.
import 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/worker.js';
