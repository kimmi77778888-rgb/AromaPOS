import {
  KHMER_AUDIO_TRANSFERRED_IN,
  KHMER_AUDIO_TRANSFERRED_IN_THANKS,
  KHMER_AUDIO_BAKONG_TRANSFERRED_IN,
  KHMER_AUDIO_PAYMENT_SUCCESS,
  KHMER_AUDIO_CASH_SUCCESS,
  KHMER_AUDIO_PAYMENT_RECEIVED
} from './khmerAudioData';
import { formatKhmerAmountAnnouncement } from '../utils/khmerCurrencyWords';

/**
 * High-Fidelity POS Audio Sound Engine
 * Combines synthesized Web Audio bells/chimes with studio-quality Khmer voice announcements ("ទទួលបានប្រាក់ដែលគេបានបាញ់ចូល").
 * 100% offline with zero external audio file dependencies.
 */

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.khmerVoiceEnabled = true;
    this.currentVoiceAudio = null;

    // Load user preferences from localStorage
    try {
      const stored = localStorage.getItem('aromapos_sound_enabled');
      if (stored !== null) {
        this.soundEnabled = stored === 'true';
      }
      const storedKm = localStorage.getItem('aromapos_khmer_voice_enabled');
      if (storedKm !== null) {
        this.khmerVoiceEnabled = storedKm === 'true';
      }
    } catch (e) {}
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = !!enabled;
    try {
      localStorage.setItem('aromapos_sound_enabled', String(this.soundEnabled));
    } catch (e) {}
    if (this.soundEnabled) {
      this.playBeepSound();
    }
  }

  toggleSound() {
    this.setSoundEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  /**
   * Authentic POS Cash Register "Ka-Ching!" Sound
   * Combines mechanical drawer latch release, bell strike resonance, and coin clink.
   */
  playCashRegisterSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // --- Layer 1: Mechanical Drawer Click / Latch Release (Noise Burst) ---
    const bufferSize = ctx.sampleRate * 0.05; // 50ms noise
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2800, now);
    noiseFilter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);

    // --- Layer 2: Ringing Cash Register Bell Chime (Dual Sine at 1760Hz & 2640Hz) ---
    const bellFreqs = [1760, 2640, 3520]; // A6 harmonic series
    bellFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.04);

      const amp = idx === 0 ? 0.35 : idx === 1 ? 0.22 : 0.12;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(amp, now + 0.04);
      // Long metallic chime tail
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.04);
      osc.stop(now + 0.9);
    });

    // --- Layer 3: Silver Coin Clink at +120ms ---
    const coinDelay = 0.12;
    const coinOsc = ctx.createOscillator();
    const coinGain = ctx.createGain();

    coinOsc.type = 'triangle';
    coinOsc.frequency.setValueAtTime(3136, now + coinDelay); // G7
    coinOsc.frequency.exponentialRampToValueAtTime(2093, now + coinDelay + 0.15); // Slide down to C7

    coinGain.gain.setValueAtTime(0.2, now + coinDelay);
    coinGain.gain.exponentialRampToValueAtTime(0.001, now + coinDelay + 0.18);

    coinOsc.connect(coinGain);
    coinGain.connect(ctx.destination);

    coinOsc.start(now + coinDelay);
    coinOsc.stop(now + coinDelay + 0.2);
  }

  /**
   * Harmonious Payment Success Chime
   * Ascending high-tone crystal chime chord (C6 -> E6 -> G6 -> C7).
   */
  playPaymentSuccessSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.0001, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.28, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.6);
    });
  }

  /**
   * Scanner Beep / Item Add
   */
  playBeepSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Warning / Error Sound
   */
  playErrorSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [320, 240].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.15, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.14);
    });
  }

  /**
   * Test Sound trigger for settings/preview
   */
  testSound() {
    this.playCashRegisterSound();
  }

  isKhmerVoiceEnabled() {
    return this.khmerVoiceEnabled;
  }

  setKhmerVoiceEnabled(enabled) {
    this.khmerVoiceEnabled = !!enabled;
    try {
      localStorage.setItem('aromapos_khmer_voice_enabled', String(this.khmerVoiceEnabled));
    } catch (e) {}
    if (this.khmerVoiceEnabled) {
      this.playKhmerVoice('success');
    }
  }

  toggleKhmerVoice() {
    this.setKhmerVoiceEnabled(!this.khmerVoiceEnabled);
    return this.khmerVoiceEnabled;
  }

  /**
   * Play Authentic Studio-Quality Khmer Voice Clip ("ទទួលបានប្រាក់ដែលគេបានបាញ់ចូល")
   * @param {'transferred_in'|'transferred_in_thanks'|'bakong'|'cash'|'received'|'success'} type
   */
  playKhmerVoice(type = 'transferred_in') {
    if (!this.soundEnabled || !this.khmerVoiceEnabled) return;

    try {
      if (this.currentVoiceAudio) {
        this.currentVoiceAudio.pause();
        this.currentVoiceAudio.currentTime = 0;
      }

      let src = KHMER_AUDIO_TRANSFERRED_IN;
      if (type === 'transferred_in' || type === 'transferred') src = KHMER_AUDIO_TRANSFERRED_IN;
      else if (type === 'transferred_in_thanks') src = KHMER_AUDIO_TRANSFERRED_IN_THANKS;
      else if (type === 'bakong') src = KHMER_AUDIO_BAKONG_TRANSFERRED_IN;
      else if (type === 'cash') src = KHMER_AUDIO_CASH_SUCCESS;
      else if (type === 'received') src = KHMER_AUDIO_PAYMENT_RECEIVED;
      else if (type === 'success') src = KHMER_AUDIO_PAYMENT_SUCCESS;

      const audio = new Audio(src);
      audio.volume = 1.0;
      this.currentVoiceAudio = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to Web Speech API if AudioElement autoplay was restricted
          this.speakKhmerFallback(type);
        });
      }
    } catch (e) {
      this.speakKhmerFallback(type);
    }
  }

  /**
   * Web Speech API Fallback for Khmer pronunciation
   */
  speakKhmerFallback(type = 'transferred_in') {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        let text = 'ទទួលបានប្រាក់ដែលគេបានបាញ់ចូល';
        if (type === 'transferred_in_thanks') text = 'ទទួលបានប្រាក់ដែលគេបានបាញ់ចូល សូមអរគុណ';
        else if (type === 'bakong') text = 'បាគង ទទួលបានប្រាក់ដែលគេបានបាញ់ចូល';
        else if (type === 'cash') text = 'សាច់ប្រាក់ ទទួលបានជោគជ័យ';
        else if (type === 'received') text = 'ទទួលបានប្រាក់ហើយ';
        else if (type === 'success') text = 'ទទួលបានប្រាក់ជោគជ័យ សូមអរគុណ';

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'km-KH';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {}
  }

  /**
   * Speak any dynamic Khmer text phrase using /api/tts/khmer, with Web Speech API km-KH fallback
   */
  speakKhmerPhrase(phrase) {
    if (!this.soundEnabled || !this.khmerVoiceEnabled || !phrase) return;

    try {
      if (this.currentVoiceAudio) {
        this.currentVoiceAudio.pause();
        this.currentVoiceAudio.currentTime = 0;
      }

      const encoded = encodeURIComponent(phrase);
      const audioUrl = `/api/tts/khmer?text=${encoded}`;
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      this.currentVoiceAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to Web Speech API
          this.speakKhmerTextFallback(phrase);
        });
      }
    } catch (e) {
      this.speakKhmerTextFallback(phrase);
    }
  }

  speakKhmerTextFallback(text) {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'km-KH';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } else {
        this.playKhmerVoice('transferred_in');
      }
    } catch (e) {
      this.playKhmerVoice('transferred_in');
    }
  }

  /**
   * Dynamically Announce the Exact Amount of Money Received in Khmer Words:
   * e.g. "ទទួលបានប្រាក់ បីដុល្លារ ហាសិបសេន" (Received 3 dollars and 50 cents)
   * or "ទទួលបានប្រាក់ ពីរម៉ឺនរៀល" (Received 20,000 Riel)
   */
  speakKhmerAmount(amount = 0, currency = 'USD') {
    if (!this.soundEnabled || !this.khmerVoiceEnabled) return;

    const phrase = formatKhmerAmountAnnouncement(amount, currency);
    this.speakKhmerPhrase(phrase);
  }

  /**
   * Full Payment Completion Audio Experience:
   * 1. Plays authentic POS cash register bell chime ("Ka-Ching!").
   * 2. Concurrently announces the exact amount of money received in Khmer words:
   *    e.g. "ទទួលបានប្រាក់ ប្រាំដុល្លារ" / "ទទួលបានប្រាក់ បីដុល្លារ ហាសិបសេន"
   */
  playKhmerPaymentSuccessSound({ paymentMethod = 'CASH', amount = 0, currency = 'USD' } = {}) {
    if (!this.soundEnabled) return;

    // 1. Play real cash register chime immediately
    this.playCashRegisterSound();

    // 2. Play Khmer voice amount announcement after 220ms (harmonizing with the bell ring)
    if (this.khmerVoiceEnabled) {
      setTimeout(() => {
        if (amount && Number(amount) > 0) {
          // Announce the exact amount transferred/paid: "ទទួលបានប្រាក់ [ចំនួន] ដុល្លារ"
          this.speakKhmerAmount(amount, currency);
        } else {
          const method = (paymentMethod || '').toUpperCase();
          if (method.includes('QR') || method.includes('KHQR') || method.includes('BAKONG')) {
            this.playKhmerVoice('transferred_in');
          } else if (method.includes('CASH')) {
            this.playKhmerVoice('cash');
          } else {
            this.playKhmerVoice('transferred_in_thanks');
          }
        }
      }, 220);
    }
  }

  /**
   * Test Sound trigger for settings/preview: Announce amount in Khmer words
   */
  testKhmerSound(amount = 3.50, currency = 'USD') {
    this.playKhmerPaymentSuccessSound({ paymentMethod: 'KHQR', amount, currency });
  }
}

export const soundService = new SoundService();
export default soundService;
