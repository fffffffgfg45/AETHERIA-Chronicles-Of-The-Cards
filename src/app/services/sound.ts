import { Injectable, signal } from '@angular/core';
import { CardRarity, SoundSettings } from '../models/game.model';

export interface MetalTrackInfo {
  id: string;
  title: string;
  artist: string;
  genre: string;
  type: 'synth' | 'ai';
  bpm?: number;
  description: string;
  audioUrl?: string;
  lyrics?: string;
  createdAt?: string;
}

export const BUILTIN_METAL_TRACKS: MetalTrackInfo[] = [
  {
    id: 'thrash-arena',
    title: 'Aetherian Doom - Iron & Fire',
    artist: 'Orchestre Métal d\'Aetheria',
    genre: 'Thrash / Speed Metal',
    type: 'synth',
    bpm: 155,
    description: 'Riffs acérés en Drop-D, double grosse caisse frénétique et solos de guitare incandescents pour l\'arène.',
  },
  {
    id: 'power-glory',
    title: 'Glory of the Fallen Knights',
    artist: 'Gardiens de la Flamme Noire',
    genre: 'Epic Power Metal',
    type: 'synth',
    bpm: 140,
    description: 'Rythmique de cavalerie au galop, harmonies de guitares jumelles et envolées épiques de triomphe.',
  },
  {
    id: 'doom-abyss',
    title: 'Abyssal Juggernaut',
    artist: 'Seigneurs du Néant',
    genre: 'Doom / Groove Metal',
    type: 'synth',
    bpm: 100,
    description: 'Basses saturées écrasantes, chugs lourds syncopés et atmosphère de cathédrale ténébreuse.',
  },
  {
    id: 'boss-symphonic',
    title: 'Wrath of the Dragon King',
    artist: 'Requiem d\'Obsidienne',
    genre: 'Symphonic Blackened Metal',
    type: 'synth',
    bpm: 165,
    description: 'Blast beats dévastateurs, riffs tranchants et puissance guerrière ultime pour les boss légendaires.',
  },
];

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;

  // Heavy Metal Synth Engine State
  private metalMasterGain: GainNode | null = null;
  private metalDistortionNode: WaveShaperNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isMetalSynthPlaying = false;
  private metalStepInterval: ReturnType<typeof setInterval> | null = null;
  private currentStep = 0;

  // HTML5 Audio Player for AI Lyria Tracks
  private aiAudioElement: HTMLAudioElement | null = null;
  private aiAudioUrl: string | null = null;

  readonly settings = signal<SoundSettings>({
    masterVolume: 80,
    musicVolume: 65,
    sfxVolume: 85,
    uiVolume: 75,
    ambientVolume: 65,
    muted: false,
  });

  // Track & Music Player Signals
  readonly isMusicPlaying = signal<boolean>(false);
  readonly currentTrack = signal<MetalTrackInfo>(BUILTIN_METAL_TRACKS[0]);
  readonly musicMode = signal<'heavy_metal' | 'ambient' | 'off'>('heavy_metal');
  readonly savedAiTracks = signal<MetalTrackInfo[]>([]);
  readonly isGeneratingAi = signal<boolean>(false);
  readonly visualizerBars = signal<number[]>([20, 45, 75, 90, 60, 85, 40, 70, 95, 55, 30, 80]);

  constructor() {
    // Load persisted sound settings & saved metal tracks
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aetheria_sound_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.settings.set({
            masterVolume: parsed.masterVolume ?? 80,
            musicVolume: parsed.musicVolume ?? 65,
            sfxVolume: parsed.sfxVolume ?? 85,
            uiVolume: parsed.uiVolume ?? 75,
            ambientVolume: parsed.ambientVolume ?? 65,
            muted: !!parsed.muted,
          });
        }

        const savedTracks = localStorage.getItem('aetheria_saved_metal_tracks');
        if (savedTracks) {
          this.savedAiTracks.set(JSON.parse(savedTracks));
        }
      } catch (e) {
        console.warn('Could not load sound settings or saved tracks', e);
      }
    }
  }

  initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  updateSettings(newSettings: Partial<SoundSettings>) {
    this.settings.update(s => {
      const updated = { ...s, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('aetheria_sound_settings', JSON.stringify(updated));
      }
      return updated;
    });

    // Update gain nodes
    if (this.ambientGain && this.audioCtx) {
      const effectiveVol = this.settings().muted ? 0 : (this.settings().masterVolume / 100) * ((this.settings().ambientVolume ?? 65) / 100) * 0.18;
      this.ambientGain.gain.setValueAtTime(effectiveVol, this.audioCtx.currentTime);
    }

    if (this.metalMasterGain && this.audioCtx) {
      const effectiveVol = this.getEffectiveGain('music') * 0.28;
      this.metalMasterGain.gain.setValueAtTime(effectiveVol, this.audioCtx.currentTime);
    }

    if (this.aiAudioElement) {
      this.aiAudioElement.volume = Math.max(0, Math.min(1, (this.getEffectiveGain('music') * 0.85)));
      this.aiAudioElement.muted = !!this.settings().muted;
    }
  }

  toggleMute() {
    this.updateSettings({ muted: !this.settings().muted });
    this.playClick(this.settings().muted ? 'crimson' : 'gold');
  }

  getEffectiveGain(type: 'sfx' | 'ui' | 'music' | 'ambient'): number {
    const s = this.settings();
    if (s.muted) return 0;
    const master = s.masterVolume / 100;
    if (type === 'sfx') return master * (s.sfxVolume / 100);
    if (type === 'ui') return master * ((s.uiVolume ?? 75) / 100);
    if (type === 'music') return master * (s.musicVolume / 100);
    if (type === 'ambient') return master * ((s.ambientVolume ?? 65) / 100);
    return master;
  }

  applyBalancedPreset(preset: 'balanced' | 'tavern' | 'battle' | 'quiet') {
    switch (preset) {
      case 'balanced':
        this.updateSettings({ masterVolume: 80, musicVolume: 60, sfxVolume: 85, uiVolume: 75, ambientVolume: 65, muted: false });
        break;
      case 'tavern':
        this.updateSettings({ masterVolume: 85, musicVolume: 75, sfxVolume: 55, uiVolume: 70, ambientVolume: 90, muted: false });
        break;
      case 'battle':
        this.updateSettings({ masterVolume: 90, musicVolume: 80, sfxVolume: 100, uiVolume: 80, ambientVolume: 40, muted: false });
        break;
      case 'quiet':
        this.updateSettings({ masterVolume: 35, musicVolume: 25, sfxVolume: 30, uiVolume: 30, ambientVolume: 25, muted: false });
        break;
    }
    this.playClick('gold');
  }

  previewChannel(channel: 'masterVolume' | 'musicVolume' | 'sfxVolume' | 'uiVolume' | 'ambientVolume') {
    if (channel === 'uiVolume') {
      this.playClick('default');
    } else if (channel === 'sfxVolume') {
      this.playSwordHit();
    } else if (channel === 'ambientVolume') {
      this.playCardDraw();
    } else if (channel === 'musicVolume') {
      if (!this.isMusicPlaying()) {
        this.playLeadSoloNote(587.33, 0.22);
      }
    } else if (channel === 'masterVolume') {
      this.playClick('gold');
    }
  }

  // ==========================================
  // HEAVY METAL PROCEDURAL SYNTHESIZER ENGINE
  // ==========================================

  private makeDistortionCurve(amount = 50): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private setupMetalAudioChain() {
    this.initAudio();
    if (!this.audioCtx) return;

    if (!this.metalMasterGain) {
      this.metalMasterGain = this.audioCtx.createGain();
      const gainVal = this.getEffectiveGain('music') * 0.28;
      this.metalMasterGain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);

      // Waveshaper high-gain overdrive
      this.metalDistortionNode = this.audioCtx.createWaveShaper();
      this.metalDistortionNode.curve = this.makeDistortionCurve(65) as unknown as Float32Array<ArrayBuffer>;
      this.metalDistortionNode.oversample = '4x';

      // Guitar Speaker Cabinet Simulator Lowpass/Bandpass
      const cabFilter = this.audioCtx.createBiquadFilter();
      cabFilter.type = 'lowpass';
      cabFilter.frequency.setValueAtTime(4200, this.audioCtx.currentTime);
      cabFilter.Q.value = 1.2;

      // Realtime Analyser for UI Equalizer
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 64;

      this.metalDistortionNode.connect(cabFilter);
      cabFilter.connect(this.metalMasterGain);
      this.metalMasterGain.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);
    }
  }

  // Trigger a heavy metal power chord (Root, 5th, Octave)
  private playPowerChord(rootFreq: number, duration = 0.25, isPalmMut = false, isAccent = false) {
    if (!this.audioCtx || !this.metalDistortionNode) return;
    const now = this.audioCtx.currentTime;

    // Frequencies: Root, Perfect 5th (x 1.4983), Octave (x 2)
    const fifthFreq = rootFreq * 1.4983;
    const octaveFreq = rootFreq * 2.0;

    const chordGain = this.audioCtx.createGain();
    const peakVol = isAccent ? 0.35 : (isPalmMut ? 0.18 : 0.28);

    chordGain.gain.setValueAtTime(0.001, now);
    chordGain.gain.linearRampToValueAtTime(peakVol, now + 0.015);

    if (isPalmMut) {
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
    } else {
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    [rootFreq, fifthFreq, octaveFreq].forEach(freq => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      osc.type = isPalmMut ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Micro detune for thick chorus guitar wall
      const detuneAmount = (Math.random() - 0.5) * 12;
      osc.detune.setValueAtTime(detuneAmount, now);

      osc.connect(chordGain);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    });

    chordGain.connect(this.metalDistortionNode);
  }

  // Heavy metal punchy double-kick drum
  private playMetalKick() {
    if (!this.audioCtx || !this.metalMasterGain) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.metalMasterGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Crisp metallic snare crack
  private playMetalSnare() {
    if (!this.audioCtx || !this.metalMasterGain) return;
    const now = this.audioCtx.currentTime;

    // Body tone
    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.metalMasterGain);
    osc.start(now);
    osc.stop(now + 0.11);

    // Noise crack
    const bufferSize = this.audioCtx.sampleRate * 0.15;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;

    const noiseFilter = this.audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1000, now);

    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.32, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.metalMasterGain);

    whiteNoise.start(now);
  }

  // Sizzling metallic hi-hat / ride cymbal
  private playMetalCymbal(isCrash = false) {
    if (!this.audioCtx || !this.metalMasterGain) return;
    const now = this.audioCtx.currentTime;
    const dur = isCrash ? 0.45 : 0.06;
    const bufferSize = this.audioCtx.sampleRate * dur;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;

    const bandpass = this.audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(isCrash ? 6000 : 9000, now);
    bandpass.Q.value = isCrash ? 2 : 5;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(isCrash ? 0.25 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    whiteNoise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.metalMasterGain);

    whiteNoise.start(now);
  }

  // Screaming lead guitar solo note
  private playLeadSoloNote(freq: number, duration = 0.2) {
    if (!this.audioCtx || !this.metalDistortionNode) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const vibrato = this.audioCtx.createOscillator();
    const vibratoGain = this.audioCtx.createGain();
    const gain = this.audioCtx.createGain();

    // 6Hz vibrato
    vibrato.frequency.setValueAtTime(6, now);
    vibratoGain.gain.setValueAtTime(8, now);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.metalDistortionNode);

    vibrato.start(now);
    osc.start(now);
    vibrato.stop(now + duration + 0.05);
    osc.stop(now + duration + 0.05);
  }

  // Step Sequencer for Heavy Metal Tracks
  private startMetalSequencer(track: MetalTrackInfo) {
    if (this.metalStepInterval) {
      clearInterval(this.metalStepInterval);
    }

    const bpm = track.bpm || 150;
    const stepDurationMs = (60000 / bpm) / 4; // 16th note steps

    // Note frequencies in Hz
    const E2 = 82.41;
    const G2 = 98.0;
    const A2 = 110.0;
    const Bb2 = 116.54;
    const D3 = 146.83;
    const E3 = 164.81;

    // Solo notes
    const E4 = 329.63;
    const G4 = 392.0;
    const A4 = 440.0;
    const Bb4 = 466.16;
    const B4 = 493.88;
    const D5 = 587.33;
    const E5 = 659.25;

    this.currentStep = 0;
    this.isMetalSynthPlaying = true;
    this.isMusicPlaying.set(true);

    this.metalStepInterval = setInterval(() => {
      if (!this.isMetalSynthPlaying || !this.audioCtx) return;

      const step = this.currentStep % 32;

      // 1. DRUMS
      // Double kick pattern
      if (track.id === 'thrash-arena' || track.id === 'boss-symphonic') {
        if (step % 2 === 0 || step % 4 === 3) {
          this.playMetalKick();
        }
      } else if (track.id === 'power-glory') {
        // Gallop drum beat
        if (step % 4 === 0 || step % 4 === 2 || step % 4 === 3) {
          this.playMetalKick();
        }
      } else {
        // Doom / Groove heavy chug
        if (step % 8 === 0 || step % 8 === 6) {
          this.playMetalKick();
        }
      }

      // Snare on 4 and 12 (standard 2 and 4 in 16th time)
      if (step % 8 === 4) {
        this.playMetalSnare();
      }

      // Hi-hats / Cymbals
      if (step === 0 || step === 16) {
        this.playMetalCymbal(true); // Crash
      } else if (step % 2 === 0) {
        this.playMetalCymbal(false); // Tight hi-hat
      }

      // 2. GUITAR RIFFS
      if (track.id === 'thrash-arena') {
        // Fast Thrash Riff in E Minor: E5 -> E5 -> G5 -> E5 -> A5 -> Bb5 -> A5 -> G5
        const riffChords = [
          E2, E2, E2, G2,
          E2, E2, A2, Bb2,
          A2, G2, E2, E2,
          E2, G2, A2, D3,
        ];
        const chord = riffChords[Math.floor(step / 2) % riffChords.length];
        const isPalmMut = step % 4 !== 3;
        const isAccent = step % 8 === 0 || step % 8 === 6;
        this.playPowerChord(chord, 0.18, isPalmMut, isAccent);

        // Lead guitar flourishes on measure 2
        if (step >= 16 && step % 4 === 0) {
          const soloScale = [E4, G4, A4, B4, D5, E5];
          const soloNote = soloScale[Math.floor(Math.random() * soloScale.length)];
          this.playLeadSoloNote(soloNote, 0.22);
        }
      } else if (track.id === 'power-glory') {
        // Epic Power Metal Riff: D -> F -> G -> A
        const chords = [
          D3, D3, D3, D3,
          G2, G2, A2, A2,
          D3, D3, D3, D3,
          Bb2, Bb2, A2, A2,
        ];
        const chord = chords[Math.floor(step / 2) % chords.length];
        this.playPowerChord(chord, 0.22, step % 2 !== 0, step % 8 === 0);

        // Twin guitar harmony solo
        if (step % 2 === 0) {
          const leadMelody = [D5, E5, G4, A4, D5, E5, A4, B4];
          this.playLeadSoloNote(leadMelody[(step / 2) % leadMelody.length], 0.15);
        }
      } else if (track.id === 'doom-abyss') {
        // Heavy Doom chugs in Drop-D (Low D2 = 73.42)
        const D2 = 73.42;
        const F2 = 87.31;
        const G2_doom = 98.0;
        const Ab2 = 103.83;

        if (step % 4 === 0) {
          const doomChords = [D2, D2, F2, D2, G2_doom, Ab2, G2_doom, F2];
          const chord = doomChords[(step / 4) % doomChords.length];
          this.playPowerChord(chord, 0.45, false, true);
        }
      } else if (track.id === 'boss-symphonic') {
        // Intense Symphonic Blackened Metal
        const bossChords = [E2, G2, Bb2, A2, E3, D3, Bb2, A2];
        const chord = bossChords[Math.floor(step / 4) % bossChords.length];
        this.playPowerChord(chord, 0.15, step % 2 === 1, step % 4 === 0);

        if (step % 3 === 0) {
          const tremoloNotes = [E5, D5, Bb4, A4, G4];
          this.playLeadSoloNote(tremoloNotes[(step / 3) % tremoloNotes.length], 0.1);
        }
      }

      // Update mock visualizer bars for energetic animation
      if (this.currentStep % 2 === 0) {
        this.visualizerBars.set([
          Math.floor(30 + Math.random() * 70),
          Math.floor(40 + Math.random() * 60),
          Math.floor(60 + Math.random() * 40),
          Math.floor(75 + Math.random() * 25),
          Math.floor(50 + Math.random() * 50),
          Math.floor(80 + Math.random() * 20),
          Math.floor(65 + Math.random() * 35),
          Math.floor(45 + Math.random() * 55),
          Math.floor(85 + Math.random() * 15),
          Math.floor(55 + Math.random() * 45),
          Math.floor(40 + Math.random() * 60),
          Math.floor(70 + Math.random() * 30),
        ]);
      }

      this.currentStep++;
    }, stepDurationMs);
  }

  // ==========================================
  // MUSIC CONTROLS (PLAY / PAUSE / SWITCH)
  // ==========================================

  playHeavyMetalTrack(trackOrId: MetalTrackInfo | string) {
    this.initAudio();
    this.stopAllMusic();

    let targetTrack: MetalTrackInfo | undefined;
    if (typeof trackOrId === 'string') {
      targetTrack = BUILTIN_METAL_TRACKS.find(t => t.id === trackOrId) ||
                    this.savedAiTracks().find(t => t.id === trackOrId);
    } else {
      targetTrack = trackOrId;
    }

    if (!targetTrack) {
      targetTrack = BUILTIN_METAL_TRACKS[0];
    }

    this.currentTrack.set(targetTrack);
    this.musicMode.set('heavy_metal');

    if (targetTrack.type === 'ai' && targetTrack.audioUrl) {
      this.playAiAudioTrack(targetTrack.audioUrl);
    } else {
      this.setupMetalAudioChain();
      this.startMetalSequencer(targetTrack);
    }
  }

  playAiAudioTrack(url: string) {
    if (typeof window === 'undefined') return;

    if (!this.aiAudioElement) {
      this.aiAudioElement = new Audio();
      this.aiAudioElement.loop = true;
    }

    this.aiAudioUrl = url;
    this.aiAudioElement.src = url;
    this.aiAudioElement.volume = Math.max(0, Math.min(1, (this.getEffectiveGain('music') * 0.85)));
    this.aiAudioElement.muted = !!this.settings().muted;

    this.aiAudioElement.play().then(() => {
      this.isMusicPlaying.set(true);
    }).catch(err => {
      console.warn('Audio autoplay prevented or error playing AI track', err);
    });
  }

  toggleMusicPlayback() {
    if (this.isMusicPlaying()) {
      this.pauseMusic();
    } else {
      this.resumeMusic();
    }
  }

  pauseMusic() {
    if (this.metalStepInterval) {
      clearInterval(this.metalStepInterval);
      this.metalStepInterval = null;
    }
    this.isMetalSynthPlaying = false;

    if (this.aiAudioElement && !this.aiAudioElement.paused) {
      this.aiAudioElement.pause();
    }

    this.isMusicPlaying.set(false);
  }

  resumeMusic() {
    const track = this.currentTrack();
    if (track) {
      this.playHeavyMetalTrack(track);
    } else {
      this.playHeavyMetalTrack(BUILTIN_METAL_TRACKS[0]);
    }
  }

  stopAllMusic() {
    this.pauseMusic();
    this.isAmbientPlaying = false;
  }

  nextTrack() {
    const allTracks = [...BUILTIN_METAL_TRACKS, ...this.savedAiTracks()];
    const currentIndex = allTracks.findIndex(t => t.id === this.currentTrack().id);
    const nextIndex = (currentIndex + 1) % allTracks.length;
    this.playHeavyMetalTrack(allTracks[nextIndex]);
  }

  previousTrack() {
    const allTracks = [...BUILTIN_METAL_TRACKS, ...this.savedAiTracks()];
    const currentIndex = allTracks.findIndex(t => t.id === this.currentTrack().id);
    const prevIndex = (currentIndex - 1 + allTracks.length) % allTracks.length;
    this.playHeavyMetalTrack(allTracks[prevIndex]);
  }

  // ==========================================
  // LYRIA AI MUSIC GENERATION CLIENT INTEGRATION
  // ==========================================

  async generateLyriaMetalTrack(options: {
    prompt?: string;
    model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
    subGenre?: string;
    customTitle?: string;
  }): Promise<MetalTrackInfo> {
    this.isGeneratingAi.set(true);

    try {
      const payload = {
        prompt: options.prompt || 'Epic heavy metal battle track with thunderous drums and shredding guitar riffs for a fantasy card battle.',
        model: options.model || 'lyria-3-clip-preview',
        genre: options.subGenre || 'heavy metal',
      };

      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success || !data.audioBase64) {
        throw new Error(data.error || 'Impossible de générer le morceau.');
      }

      // Convert base64 to Blob URL
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const newTrack: MetalTrackInfo = {
        id: 'ai-metal-' + Date.now(),
        title: options.customTitle || `Lyria Metal: ${options.subGenre || 'Arène Sanglante'}`,
        artist: `Lyria AI (${data.model === 'lyria-3-pro-preview' ? 'Lyria Pro' : 'Lyria Clip'})`,
        genre: `Heavy Metal (${data.genre || 'Epic Battle'})`,
        type: 'ai',
        description: options.prompt || 'Morceau Heavy Metal généré par Lyria AI.',
        audioUrl,
        lyrics: data.lyrics,
        createdAt: new Date().toLocaleTimeString(),
      };

      // Save track
      this.savedAiTracks.update(list => {
        const updated = [newTrack, ...list];
        if (typeof window !== 'undefined') {
          try {
            // Store metadata (without large base64 strings to keep localStorage small)
            const serialized = updated.map(t => ({
              ...t,
              audioUrl: undefined, // URLs will be re-created during active session
            }));
            localStorage.setItem('aetheria_saved_metal_tracks', JSON.stringify(serialized));
          } catch (e) {
            console.warn('LocalStorage limit for metal tracks', e);
          }
        }
        return updated;
      });

      // Play immediately
      this.playHeavyMetalTrack(newTrack);

      return newTrack;
    } finally {
      this.isGeneratingAi.set(false);
    }
  }

  // ==========================================
  // SOUND EFFECTS (SFX & GUI)
  // ==========================================

  playGuitarSoloRiff() {
    this.initAudio();
    this.setupMetalAudioChain();
    if (!this.audioCtx || !this.metalDistortionNode) return;

    const notes = [329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playLeadSoloNote(freq, 0.15);
      }, idx * 60);
    });
  }

  // Tactile Medieval Button Click with physical wood/brass mechanical resonance
  playClick(variant: 'default' | 'crimson' | 'gold' | 'parchment' = 'default') {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('ui') * 0.45;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;

    // 1. Crisp tactile transient punch (wooden/switch snap)
    const snapOsc = this.audioCtx.createOscillator();
    const snapGain = this.audioCtx.createGain();
    snapOsc.type = 'triangle';
    
    let startFreq = 520;
    let endFreq = 140;
    let duration = 0.055;

    if (variant === 'gold') {
      startFreq = 880;
      endFreq = 320;
      duration = 0.07;
    } else if (variant === 'crimson') {
      startFreq = 340;
      endFreq = 75;
      duration = 0.065;
    } else if (variant === 'parchment') {
      startFreq = 640;
      endFreq = 220;
      duration = 0.045;
    }

    snapOsc.frequency.setValueAtTime(startFreq, now);
    snapOsc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    snapGain.gain.setValueAtTime(gainVal * 0.8, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    snapOsc.connect(snapGain);
    snapGain.connect(this.audioCtx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + duration);

    // 2. Subtle metallic ring resonance for gold & crimson buttons
    if (variant === 'gold' || variant === 'crimson') {
      const ringOsc = this.audioCtx.createOscillator();
      const ringGain = this.audioCtx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(variant === 'gold' ? 1320 : 660, now + 0.01);

      ringGain.gain.setValueAtTime(gainVal * 0.22, now + 0.01);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      ringOsc.connect(ringGain);
      ringGain.connect(this.audioCtx.destination);
      ringOsc.start(now + 0.01);
      ringOsc.stop(now + 0.13);
    }
  }

  // Card Draw Swoosh
  playCardDraw() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.35;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(650, now + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Medieval Grimoire / Parchment Page Flip Rustle
  playParchmentFlip() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('ui') * 0.4;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();

    // Soft rustle frequency sweep mimicking dry parchment turning
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.linearRampToValueAtTime(600, now + 0.18);
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.2);

    // Subtle paper edge flick
    const flickOsc = this.audioCtx.createOscillator();
    const flickGain = this.audioCtx.createGain();
    flickOsc.type = 'sine';
    flickOsc.frequency.setValueAtTime(840, now + 0.04);
    flickOsc.frequency.exponentialRampToValueAtTime(280, now + 0.1);
    flickGain.gain.setValueAtTime(gainVal * 0.25, now + 0.04);
    flickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    flickOsc.connect(flickGain);
    flickGain.connect(this.audioCtx.destination);
    flickOsc.start(now + 0.04);
    flickOsc.stop(now + 0.12);
  }

  // Card Slam / Summon Impact
  playCardSummon(rarity = 'common') {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.5;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = rarity === 'legendary' || rarity === 'mythic' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.26);

    if (rarity === 'legendary' || rarity === 'mythic') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        if (!this.audioCtx) return;
        const chimeOsc = this.audioCtx.createOscillator();
        const chimeGain = this.audioCtx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, now + i * 0.05);

        chimeGain.gain.setValueAtTime(gainVal * 0.3, now + i * 0.05);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.audioCtx.destination);

        chimeOsc.start(now + i * 0.05);
        chimeOsc.stop(now + i * 0.05 + 0.3);
      });
    }
  }

  // Sword Strike / Physical Attack Impact with heavy metal crunch
  playSwordHit() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.45;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  // Magic Spell Blast
  playSpellBlast() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.4;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.35);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Potion Drinking
  playPotion() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.35;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    [260, 320, 420, 560].forEach((freq, idx) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      osc.frequency.linearRampToValueAtTime(freq + 80, now + idx * 0.06 + 0.08);

      gain.gain.setValueAtTime(gainVal * 0.5, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.09);
    });
  }

  // Cauldron Bubbling Effect
  playCauldronBubbling() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('ui') * 0.35;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    [180, 240, 160, 220, 280].forEach((freq, idx) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      osc.frequency.linearRampToValueAtTime(freq + 60, now + idx * 0.08 + 0.07);

      gain.gain.setValueAtTime(gainVal * 0.4, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.07);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.08);
    });
  }

  // Alchemical Transmutation Chime
  playAlchemicalTransmute() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.45;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(gainVal * 0.35, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.36);
    });
  }

  // Coin Clink
  playCoins() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.35;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    [987.77, 1318.51, 1567.98].forEach((freq, idx) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(gainVal, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.16);
    });
  }

  // End Turn Bell
  playTurnGong() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.35;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(349.23, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.8);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.81);
  }

  // Victory Metal Power Fanfare
  playVictory() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.45;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const notes = [
      { freq: 440, time: 0, dur: 0.15 },
      { freq: 554.37, time: 0.15, dur: 0.15 },
      { freq: 659.25, time: 0.3, dur: 0.18 },
      { freq: 880, time: 0.48, dur: 0.6 },
    ];

    notes.forEach(n => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(gainVal, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur + 0.05);
    });

    this.playGuitarSoloRiff();
  }

  // Defeat Somber Horn
  playDefeat() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('sfx') * 0.4;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const notes = [
      { freq: 330, time: 0, dur: 0.3 },
      { freq: 311.13, time: 0.3, dur: 0.3 },
      { freq: 293.66, time: 0.6, dur: 0.6 },
    ];

    notes.forEach(n => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(gainVal * 0.6, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur + 0.05);
    });
  }

  // Tutorial Chime
  playTutorialChime() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('ui') * 0.45;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(gainVal, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.36);
    });
  }

  // Book Page Turn
  playPageTurn() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('ui') * 0.3;
    if (gainVal <= 0) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    try {
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // safe fallback
    }
  }

  // Majestic Medieval Kingdom Entrance Fanfare & Portal Gates Opening
  playGameEntranceFanfare() {
    this.initAudio();
    if (!this.audioCtx) return;
    const sfxVol = this.getEffectiveGain('sfx');
    if (sfxVol <= 0) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // 1. Deep Stone Gate & Portcullis Rumble (Low Thunder / Stone scraping)
    const rumbleOsc = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    const rumbleFilter = ctx.createBiquadFilter();

    rumbleOsc.type = 'sawtooth';
    rumbleOsc.frequency.setValueAtTime(65, now);
    rumbleOsc.frequency.linearRampToValueAtTime(32, now + 1.2);

    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(140, now);
    rumbleFilter.frequency.linearRampToValueAtTime(75, now + 1.2);

    rumbleGain.gain.setValueAtTime(sfxVol * 0.45, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);

    rumbleOsc.start(now);
    rumbleOsc.stop(now + 1.6);

    // 2. Metallic Sword Clash / Portcullis Chain Impact (at 0.18s)
    const swordTime = now + 0.18;
    const swordOsc = ctx.createOscillator();
    const swordGain = ctx.createGain();
    swordOsc.type = 'triangle';
    swordOsc.frequency.setValueAtTime(880, swordTime);
    swordOsc.frequency.exponentialRampToValueAtTime(220, swordTime + 0.3);
    swordGain.gain.setValueAtTime(sfxVol * 0.42, swordTime);
    swordGain.gain.exponentialRampToValueAtTime(0.001, swordTime + 0.35);
    swordOsc.connect(swordGain);
    swordGain.connect(ctx.destination);
    swordOsc.start(swordTime);
    swordOsc.stop(swordTime + 0.36);

    // 3. Royal Brass Fanfare Chords (Heraldic Trumpets - D Major: D - F# - A - D - F#)
    const trumpetNotes = [
      { freq: 146.83, delay: 0.15, dur: 0.8, vol: 0.25 }, // D3 (Bass Horn)
      { freq: 220.00, delay: 0.25, dur: 0.6, vol: 0.30 }, // A3
      { freq: 293.66, delay: 0.38, dur: 0.7, vol: 0.35 }, // D4
      { freq: 369.99, delay: 0.52, dur: 0.8, vol: 0.40 }, // F#4
      { freq: 440.00, delay: 0.68, dur: 1.0, vol: 0.42 }, // A4
      { freq: 587.33, delay: 0.85, dur: 1.4, vol: 0.48 }, // D5 (Triumph Peak)
      { freq: 739.99, delay: 0.95, dur: 1.5, vol: 0.35 }, // F#5 (Majestic 3rd)
    ];

    trumpetNotes.forEach(tn => {
      const startT = now + tn.delay;
      // Primary Brass Horn
      const hornOsc = ctx.createOscillator();
      const hornGain = ctx.createGain();
      const hornFilter = ctx.createBiquadFilter();

      hornOsc.type = 'sawtooth';
      hornOsc.frequency.setValueAtTime(tn.freq, startT);

      hornFilter.type = 'lowpass';
      hornFilter.frequency.setValueAtTime(1400, startT);
      hornFilter.frequency.linearRampToValueAtTime(2200, startT + 0.15);
      hornFilter.frequency.linearRampToValueAtTime(1000, startT + tn.dur);

      hornGain.gain.setValueAtTime(0.001, startT);
      hornGain.gain.linearRampToValueAtTime(sfxVol * tn.vol, startT + 0.06);
      hornGain.gain.exponentialRampToValueAtTime(0.001, startT + tn.dur);

      hornOsc.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(ctx.destination);

      hornOsc.start(startT);
      hornOsc.stop(startT + tn.dur + 0.05);

      // Warm Octave Sub-harmonics for richness
      const warmOsc = ctx.createOscillator();
      const warmGain = ctx.createGain();
      warmOsc.type = 'triangle';
      warmOsc.frequency.setValueAtTime(tn.freq * 0.5, startT);
      warmGain.gain.setValueAtTime(sfxVol * tn.vol * 0.4, startT);
      warmGain.gain.exponentialRampToValueAtTime(0.001, startT + tn.dur);
      warmOsc.connect(warmGain);
      warmGain.connect(ctx.destination);
      warmOsc.start(startT);
      warmOsc.stop(startT + tn.dur + 0.05);
    });

    // 4. Celestial Magic Runes Shimmer (Harp Chimes from 0.9s to 1.5s)
    const shimmerNotes = [587.33, 739.99, 880.0, 1174.66, 1479.98, 1760.0];
    shimmerNotes.forEach((freq, idx) => {
      const shimTime = now + 0.9 + idx * 0.07;
      const shimOsc = ctx.createOscillator();
      const shimGain = ctx.createGain();
      shimOsc.type = 'sine';
      shimOsc.frequency.setValueAtTime(freq, shimTime);
      shimGain.gain.setValueAtTime(sfxVol * 0.24, shimTime);
      shimGain.gain.exponentialRampToValueAtTime(0.001, shimTime + 0.45);
      shimOsc.connect(shimGain);
      shimGain.connect(ctx.destination);
      shimOsc.start(shimTime);
      shimOsc.stop(shimTime + 0.46);
    });

    // 5. Grand Cathedral Bell Resonance (Low Gong Ring at 0.95s)
    const bellTime = now + 0.95;
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(220, bellTime);
    bellGain.gain.setValueAtTime(sfxVol * 0.35, bellTime);
    bellGain.gain.exponentialRampToValueAtTime(0.001, bellTime + 1.8);
    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(bellTime);
    bellOsc.stop(bellTime + 1.85);
  }

  // Epic Fullscreen Skin Unlock Reveal Fanfare (scaled by rarity)
  playSkinReveal(rarity: CardRarity = 'rare') {
    this.initAudio();
    if (!this.audioCtx) return;
    const sfxVol = this.getEffectiveGain('sfx');
    if (sfxVol <= 0) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // 1. Ethereal Veil Opening Swell (0.0s - 0.36s)
    const sweepOsc = ctx.createOscillator();
    const sweepFilter = ctx.createBiquadFilter();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(140, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(520, now + 0.36);

    sweepFilter.type = 'bandpass';
    sweepFilter.frequency.setValueAtTime(320, now);
    sweepFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.36);
    sweepFilter.Q.value = 2.2;

    sweepGain.gain.setValueAtTime(0.001, now);
    sweepGain.gain.linearRampToValueAtTime(sfxVol * 0.28, now + 0.24);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    sweepOsc.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.45);

    // 2. Sub-bass Seal Break Impact (at 0.34s)
    const impactTime = now + 0.34;
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(135, impactTime);
    subOsc.frequency.exponentialRampToValueAtTime(38, impactTime + 0.35);

    subGain.gain.setValueAtTime(sfxVol * 0.48, impactTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.4);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(impactTime);
    subOsc.stop(impactTime + 0.42);

    // Metallic Crest Strike
    const crestOsc = ctx.createOscillator();
    const crestGain = ctx.createGain();
    crestOsc.type = 'triangle';
    crestOsc.frequency.setValueAtTime(980, impactTime);
    crestOsc.frequency.exponentialRampToValueAtTime(310, impactTime + 0.16);
    crestGain.gain.setValueAtTime(sfxVol * 0.32, impactTime);
    crestGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.2);
    crestOsc.connect(crestGain);
    crestGain.connect(ctx.destination);
    crestOsc.start(impactTime);
    crestOsc.stop(impactTime + 0.22);

    // 3. Rarity-Scaled Heroic Reveal Arpeggio
    let chordNotes: number[];
    let sustain = 0.55;
    if (rarity === 'common') {
      chordNotes = [261.63, 329.63, 392.0];
      sustain = 0.4;
    } else if (rarity === 'rare') {
      chordNotes = [293.66, 369.99, 440.0, 587.33];
      sustain = 0.52;
    } else if (rarity === 'epic') {
      chordNotes = [329.63, 415.3, 493.88, 659.25, 830.61];
      sustain = 0.65;
    } else if (rarity === 'legendary') {
      chordNotes = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0, 1174.66];
      sustain = 0.85;
    } else {
      // mythic
      chordNotes = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0, 1174.66, 1479.98];
      sustain = 1.05;
    }

    chordNotes.forEach((freq, idx) => {
      const noteTime = impactTime + 0.04 + idx * 0.065;
      const mainOsc = ctx.createOscillator();
      const harmOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      mainOsc.type = rarity === 'legendary' || rarity === 'mythic' ? 'sawtooth' : 'triangle';
      mainOsc.frequency.setValueAtTime(freq, noteTime);

      harmOsc.type = 'sine';
      harmOsc.frequency.setValueAtTime(freq * 2, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, noteTime);
      filter.frequency.exponentialRampToValueAtTime(1100, noteTime + sustain);

      const peak = sfxVol * (idx === chordNotes.length - 1 ? 0.34 : 0.22);
      noteGain.gain.setValueAtTime(0.001, noteTime);
      noteGain.gain.linearRampToValueAtTime(peak, noteTime + 0.025);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + sustain);

      mainOsc.connect(filter);
      harmOsc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(ctx.destination);

      mainOsc.start(noteTime);
      harmOsc.start(noteTime);
      mainOsc.stop(noteTime + sustain + 0.05);
      harmOsc.stop(noteTime + sustain + 0.05);
    });

    // 4. Celestial Resonance Bell for Epic, Legendary & Mythic Skins
    if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') {
      const bellAt = impactTime + 0.25;
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(rarity === 'mythic' ? 587.33 : 440.0, bellAt);
      bellGain.gain.setValueAtTime(sfxVol * 0.28, bellAt);
      bellGain.gain.exponentialRampToValueAtTime(0.001, bellAt + 1.5);
      bell.connect(bellGain);
      bellGain.connect(ctx.destination);
      bell.start(bellAt);
      bell.stop(bellAt + 1.55);
    }
  }

  // Tactile magnetic pedestal snap when dropping an item into a trade zone
  playTradeDropSnap() {
    this.initAudio();
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain('ui') * 0.5;
    if (gainVal <= 0) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Low wooden/stone thud
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(190, now);
    thudOsc.frequency.exponentialRampToValueAtTime(62, now + 0.11);
    thudGain.gain.setValueAtTime(gainVal * 0.75, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.13);

    // Subtle brass rune lock ping
    const pingOsc = ctx.createOscillator();
    const pingGain = ctx.createGain();
    pingOsc.type = 'sine';
    pingOsc.frequency.setValueAtTime(740, now + 0.03);
    pingOsc.frequency.exponentialRampToValueAtTime(987.77, now + 0.12);
    pingGain.gain.setValueAtTime(gainVal * 0.35, now + 0.03);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    pingOsc.connect(pingGain);
    pingGain.connect(ctx.destination);
    pingOsc.start(now + 0.03);
    pingOsc.stop(now + 0.23);
  }

  // Ethereal magical smoke whoosh + crystalline seal chime for Marketplace confirmations
  playTradeSmokeMagic() {
    this.initAudio();
    if (!this.audioCtx) return;
    const sfxVol = this.getEffectiveGain('sfx');
    if (sfxVol <= 0) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // 1. Filtered noise smoke puff whoosh
    const dur = 0.75;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(1650, now + 0.24);
    filter.frequency.exponentialRampToValueAtTime(480, now + dur);
    filter.Q.value = 1.6;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(sfxVol * 0.32, now + 0.08);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 2. Arcane sealing chime arpeggio
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + 0.06 + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(sfxVol * 0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // Ambient Tavern Background
  startAmbientMusic() {
    if (this.isAmbientPlaying || typeof window === 'undefined') return;
    this.initAudio();
    if (!this.audioCtx) return;

    this.isAmbientPlaying = true;
    const masterGain = this.audioCtx.createGain();
    const effectiveVol = this.settings().muted ? 0 : (this.settings().masterVolume / 100) * (this.settings().musicVolume / 100) * 0.12;
    masterGain.gain.setValueAtTime(effectiveVol, this.audioCtx.currentTime);
    masterGain.connect(this.audioCtx.destination);
    this.ambientGain = masterGain;

    const droneOsc = this.audioCtx.createOscillator();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(110, this.audioCtx.currentTime);
    droneOsc.connect(masterGain);
    droneOsc.start();
  }
}
