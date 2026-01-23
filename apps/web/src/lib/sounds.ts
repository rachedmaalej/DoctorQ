/**
 * Notification sounds for DoctorQ dashboard
 * Uses Web Audio API to generate sounds without external files
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play the medical chime notification sound
 * Classic two-tone hospital chime - Sound #1 from notification-sounds-demo.html
 * @param volume - Volume level from 0 to 1 (default: 0.35)
 */
export function playDoorbellSound(volume: number = 0.35): void {
  try {
    const ctx = getAudioContext();
    // Medical Chime: A4 (440 Hz) then C#5 (554.37 Hz)
    [440, 554.37].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.4);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.4);
    });
  } catch (e) {
    // Audio not supported or failed - silently ignore
    console.warn('[Sound] Failed to play medical chime:', e);
  }
}

/**
 * Initialize audio context on user interaction
 * Call this once after first user click to enable audio
 */
export function initAudioContext(): void {
  try {
    getAudioContext();
  } catch (e) {
    console.warn('[Sound] Failed to initialize audio context:', e);
  }
}
