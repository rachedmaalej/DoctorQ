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
 * Play the doorbell notification sound
 * Classic two-tone doorbell - Sound #38 from notification-sounds-demo.html
 * @param volume - Volume level from 0 to 1 (default: 0.35)
 */
export function playDoorbellSound(volume: number = 0.35): void {
  try {
    const ctx = getAudioContext();
    // Two-tone doorbell: E5 (659.25 Hz) then C5 (523.25 Hz)
    [659.25, 523.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.25 + 0.35);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.35);
    });
  } catch (e) {
    // Audio not supported or failed - silently ignore
    console.warn('[Sound] Failed to play doorbell:', e);
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
