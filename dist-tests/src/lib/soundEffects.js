/**
 * Chess Sound Effects using Web Audio API
 * Generates synthetic sounds for different chess events
 */
let audioContext = null;
// Volume state (0 to 1) with localStorage persistence
const VOLUME_STORAGE_KEY = 'chess-review-volume';
function loadVolumeFromStorage() {
    try {
        const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
        if (stored !== null) {
            const parsed = parseFloat(stored);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                return parsed;
            }
        }
    }
    catch {
        // localStorage may not be available
    }
    return 0.7;
}
let currentVolume = loadVolumeFromStorage();
function getAudioContext() {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    // Resume context if it's suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}
/**
 * Set the master volume for all sound effects
 * @param volume - Value between 0 (silent) and 1 (full volume)
 */
export function setVolume(volume) {
    currentVolume = Math.max(0, Math.min(1, volume));
    try {
        localStorage.setItem(VOLUME_STORAGE_KEY, currentVolume.toString());
    }
    catch {
        // localStorage may not be available
    }
}
/**
 * Get the current master volume
 * @returns Current volume (0 to 1)
 */
export function getVolume() {
    return currentVolume;
}
/**
 * Play a short "click/thud" sound for regular moves
 */
export function playMoveSound() {
    if (currentVolume === 0)
        return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        // Create a short percussive sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        gain.gain.setValueAtTime(0.3 * currentVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }
    catch {
        // Silently fail if audio isn't available
    }
}
/**
 * Play a sharper sound for captures
 */
export function playCaptureSound() {
    if (currentVolume === 0)
        return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        // More aggressive, louder sound for captures
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.exponentialRampToValueAtTime(100, now + 0.12);
        gain.gain.setValueAtTime(0.25 * currentVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.1);
        osc2.start(now);
        osc2.stop(now + 0.12);
    }
    catch {
        // Silently fail
    }
}
/**
 * Play a distinctive alert sound for checks
 */
export function playCheckSound() {
    if (currentVolume === 0)
        return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        // Two-tone alert sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1100, now + 0.06); // Higher tone
        osc.frequency.setValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.35 * currentVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    catch {
        // Silently fail
    }
}
/**
 * Play a special sound for castling
 */
export function playCastleSound() {
    if (currentVolume === 0)
        return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        // Sweeping sound to represent the special move
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.08);
        osc.frequency.linearRampToValueAtTime(450, now + 0.15);
        gain.gain.setValueAtTime(0.3 * currentVolume, now);
        gain.gain.setValueAtTime(0.3 * currentVolume, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }
    catch {
        // Silently fail
    }
}
/**
 * Play a final sound for game end (checkmate, stalemate, etc.)
 */
export function playGameEndSound() {
    if (currentVolume === 0)
        return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        // Descending final tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.3);
        gain.gain.setValueAtTime(0.3 * currentVolume, now);
        gain.gain.setValueAtTime(0.3 * currentVolume, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }
    catch {
        // Silently fail
    }
}
/**
 * Play a pleasant ascending chime for success events (PGN load, etc.)
 */
export function playSuccessSound() {
    if (currentVolume === 0)
        return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        // Two ascending tones for a positive feel
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now); // C5
        osc.frequency.setValueAtTime(659, now + 0.1); // E5
        osc.frequency.setValueAtTime(784, now + 0.2); // G5
        gain.gain.setValueAtTime(0.3 * currentVolume, now);
        gain.gain.setValueAtTime(0.3 * currentVolume, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }
    catch {
        // Silently fail
    }
}
/**
 * Play a harsh descending buzz for error events
 */
export function playErrorSound() {
    if (currentVolume === 0)
        return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        // Dissonant descending buzz
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.linearRampToValueAtTime(150, now + 0.2);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(350, now);
        osc2.frequency.linearRampToValueAtTime(120, now + 0.2);
        gain.gain.setValueAtTime(0.2 * currentVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.2);
        osc2.start(now);
        osc2.stop(now + 0.2);
    }
    catch {
        // Silently fail
    }
}
/**
 * Play a triumphant fanfare for analysis completion
 */
export function playAnalysisCompleteSound() {
    if (currentVolume === 0)
        return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        // Three-note ascending fanfare
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554, now + 0.12); // C#5
        osc.frequency.setValueAtTime(659, now + 0.24); // E5
        osc.frequency.setValueAtTime(880, now + 0.36); // A5
        gain.gain.setValueAtTime(0.3 * currentVolume, now);
        gain.gain.setValueAtTime(0.3 * currentVolume, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }
    catch {
        // Silently fail
    }
}
/**
 * Determine and play the appropriate sound for a chess move
 * @param san - Standard Algebraic Notation of the move
 * @param isCheckmate - Whether this move results in checkmate
 * @param isStalemate - Whether this move results in stalemate
 */
export function playMoveByType(san, isCheckmate = false, isStalemate = false) {
    // Game end sounds take priority
    if (isCheckmate || isStalemate) {
        playGameEndSound();
        return;
    }
    // Check for castling
    if (san === 'O-O' || san === 'O-O-O') {
        playCastleSound();
        return;
    }
    // Check for check (contains + or #)
    if (san.includes('+') || san.includes('#')) {
        playCheckSound();
        return;
    }
    // Check for captures (contains 'x')
    if (san.includes('x')) {
        playCaptureSound();
        return;
    }
    // Regular move
    playMoveSound();
}
