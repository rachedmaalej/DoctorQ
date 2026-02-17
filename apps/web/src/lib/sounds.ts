/**
 * Notification sounds for DoctorQ
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
 * Initialize audio context on user interaction.
 * Call this once after first user tap/click to enable audio on iOS.
 */
export function initAudioContext(): void {
  try {
    const ctx = getAudioContext();
    // Play a silent buffer to fully unlock on iOS
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (e) {
    console.warn('[Sound] Failed to initialize audio context:', e);
  }
}

/**
 * Sound #1: Soft Chime — single high bell tone (C6), gentle fade.
 * Used when patient moves forward in queue (position >= 3).
 */
export function playSoftChime(volume = 0.25): void {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, t); // C6
    gain.gain.setValueAtTime(volume * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t);
    osc.stop(t + 0.8);
  } catch (e) {
    console.warn('[Sound] Soft chime failed:', e);
  }
}

/**
 * Sound #7: Medical Chime — hospital-style A4 to C#5 two-tone.
 * Used when patient reaches position #2 (almost there).
 */
export function playMedicalChime(volume = 0.35): void {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    [440, 554.37].forEach((freq, i) => { // A4, C#5
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.22);
      gain.gain.setValueAtTime(volume * 0.4, t + i * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.4);
      osc.start(t + i * 0.22);
      osc.stop(t + i * 0.22 + 0.4);
    });
  } catch (e) {
    console.warn('[Sound] Medical chime failed:', e);
  }
}

/**
 * Sound #8: Bright Alert — fast ascending C-major arpeggio (C5-E5-G5-C6).
 * Used when patient reaches position #1 (you're next).
 */
export function playBrightAlert(volume = 0.35): void {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { // C5, E5, G5, C6
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);
      gain.gain.setValueAtTime(volume * 0.28, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.18);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.18);
    });
  } catch (e) {
    console.warn('[Sound] Bright alert failed:', e);
  }
}

/**
 * Sound #10: Priority Alarm — ascending G4-C5-E5 played twice (6 notes).
 * Used when it's the patient's turn (IN_CONSULTATION).
 */
export function playPriorityAlarm(volume = 0.45): void {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    const pattern = [392, 523.25, 659.25, 392, 523.25, 659.25]; // G4, C5, E5 × 2
    pattern.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(volume * 0.38, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.1);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.1);
    });
  } catch (e) {
    console.warn('[Sound] Priority alarm failed:', e);
  }
}

// Legacy alias for dashboard usage
export const playDoorbellSound = playMedicalChime;
