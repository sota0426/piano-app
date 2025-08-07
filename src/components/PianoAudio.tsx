//src\components\PianoAudio.tsx

import { useRef, useEffect, useCallback } from 'react';

const useRealisticPianoAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // 音の周波数定義（左手用に低音域を追加）
  const noteFrequencies: { [note: string]: number } = {
    // 左手用低音域
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41,
    'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00,
    'A#2': 116.54, 'B2': 123.47,
    
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
    'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
    'A#3': 233.08, 'B3': 246.94,

    // 既存の右手用音域
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
    'A#4': 466.16, 'B4': 493.88, 
    
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33,
    'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
    'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91
  };

  // ピアノの音域による音色の違いを定義（低音域対応）
  const getPianoCharacteristics = (frequency: number) => {
    if (frequency < 150) {
      // 超低音域：非常に重い、長い残響
      return {
        brightness: 0.4,
        sustain: 2.5,
        harmonicStrength: 0.9,
        noiseLevel: 0.2,
        filterCutoff: frequency * 4
      };
    } else if (frequency < 300) {
      // 低音域：より重い、残響の多い音
      return {
        brightness: 0.6,
        sustain: 1.8,
        harmonicStrength: 0.8,
        noiseLevel: 0.15,
        filterCutoff: frequency * 6
      };
    } else if (frequency < 600) {
      // 中音域：バランスの取れた音
      return {
        brightness: 0.8,
        sustain: 1.2,
        harmonicStrength: 1.0,
        noiseLevel: 0.12,
        filterCutoff: frequency * 8
      };
    } else {
      // 高音域：明るく、短い持続時間
      return {
        brightness: 1.0,
        sustain: 0.8,
        harmonicStrength: 0.6,
        noiseLevel: 0.08,
        filterCutoff: frequency * 12
      };
    }
  };

  // Web Audio APIの初期化
  useEffect(() => {
    const initAudio = () => {
      try {
        const win = window;
        audioContextRef.current = new (win.AudioContext || (win as any).webkitAudioContext)();
        console.log("Realistic Piano Audio initialized successfully");
      } catch (error) {
        console.error('Failed to initialize Realistic Piano Audio:', error);
      }
    };

    const handleFirstInteraction = () => {
      initAudio();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // より高品質なリバーブを作成
  const createReverbImpulse = (context: AudioContext, duration: number, decay: number) => {
    const impulse = context.createBuffer(2, context.sampleRate * duration, context.sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    for (let i = 0; i < impulse.length; i++) {
      const t = i / context.sampleRate;
      const envelope = Math.pow(1 - t / duration, decay);
      
      // より自然なリバーブパターン
      const noise = (Math.random() * 2 - 1) * envelope;
      const earlyReflection = Math.sin(t * 50) * envelope * 0.3;
      
      left[i] = (noise + earlyReflection) * 0.5;
      right[i] = (noise - earlyReflection) * 0.5;
    }
    
    return impulse;
  };

  // ピアノらしい音の再生（低音域対応改良版）
  const playRealisticPianoTone = useCallback((frequency: number, duration = 1.2, velocity = 0.8) => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    const characteristics = getPianoCharacteristics(frequency);
    const effectiveDuration = duration * characteristics.sustain;

    // メインの音響チェーンを作成
    const masterGain = context.createGain();
    
    // リバーブ作成（低音域用に調整）
    const reverbDuration = frequency < 200 ? 3.0 : 2.0;
    const convolver = context.createConvolver();
    convolver.buffer = createReverbImpulse(context, reverbDuration, 3.0);
    
    const dryGain = context.createGain();
    const wetGain = context.createGain();
    
    // 低音域はリバーブを強めに
    if (frequency < 200) {
      dryGain.gain.value = 0.6;
      wetGain.gain.value = 0.4;
    } else {
      dryGain.gain.value = 0.7;
      wetGain.gain.value = 0.3;
    }
    
    masterGain.connect(dryGain);
    masterGain.connect(convolver);
    convolver.connect(wetGain);
    
    dryGain.connect(context.destination);
    wetGain.connect(context.destination);

    // 1. ハンマーアタック音（低音域対応）
    const createHammerNoise = () => {
      const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.08, context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < noiseData.length; i++) {
        const t = i / context.sampleRate;
        const envelope = Math.exp(-t * (frequency < 200 ? 30 : 50)); // 低音域は緩やかな減衰
        noiseData[i] = (Math.random() * 2 - 1) * envelope * characteristics.noiseLevel * velocity;
      }
      
      const noiseSource = context.createBufferSource();
      const noiseGain = context.createGain();
      const noiseFilter = context.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = frequency * (frequency < 200 ? 6 : 8);
      noiseFilter.Q.value = 2;
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      
      noiseGain.gain.setValueAtTime(velocity * 0.5, context.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
      
      noiseSource.start(context.currentTime);
      noiseSource.stop(context.currentTime + 0.08);
    };

    createHammerNoise();

    // 2. 弦の倍音構造（低音域対応）
    const harmonics = [
      { freq: frequency, gain: 1.0, detune: 0, type: 'sawtooth' as OscillatorType },
      { freq: frequency * 2, gain: frequency < 200 ? 0.7 : 0.5, detune: -2, type: 'sawtooth' as OscillatorType },
      { freq: frequency * 3, gain: frequency < 200 ? 0.4 : 0.25, detune: 1, type: 'triangle' as OscillatorType },
      { freq: frequency * 4, gain: frequency < 200 ? 0.25 : 0.15, detune: -1, type: 'triangle' as OscillatorType },
      { freq: frequency * 5, gain: frequency < 200 ? 0.15 : 0.1, detune: 2, type: 'sine' as OscillatorType },
      { freq: frequency * 6, gain: frequency < 200 ? 0.12 : 0.08, detune: -1.5, type: 'sine' as OscillatorType },
      { freq: frequency * 7, gain: frequency < 200 ? 0.1 : 0.06, detune: 1.2, type: 'sine' as OscillatorType },
      { freq: frequency * 8, gain: frequency < 200 ? 0.08 : 0.04, detune: -0.8, type: 'sine' as OscillatorType },
      // 非整数倍音（弦の非線形性をシミュレート）
      { freq: frequency * 2.1, gain: 0.02, detune: 0, type: 'sine' as OscillatorType },
      { freq: frequency * 3.05, gain: 0.015, detune: 0, type: 'sine' as OscillatorType }
    ];

    harmonics.forEach((harmonic, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const harmonicFilter = context.createBiquadFilter();
      
      oscillator.type = harmonic.type;
      oscillator.frequency.setValueAtTime(harmonic.freq, context.currentTime);
      oscillator.detune.setValueAtTime(harmonic.detune, context.currentTime);
      
      // 各倍音に個別のフィルタリング
      harmonicFilter.type = 'lowpass';
      harmonicFilter.frequency.value = characteristics.filterCutoff * (1 - index * 0.1);
      harmonicFilter.Q.value = 0.7;
      
      oscillator.connect(harmonicFilter);
      harmonicFilter.connect(gainNode);
      gainNode.connect(masterGain);
      
      // より自然なエンベロープ
      const harmonicGain = harmonic.gain * characteristics.harmonicStrength * velocity;
      const attackTime = 0.008 + (index * 0.002); // 倍音ごとに微妙に異なるアタック
      const decayTime = effectiveDuration * (0.8 + index * 0.05);
      
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(harmonicGain * 0.8, context.currentTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(harmonicGain * 0.6, context.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(harmonicGain * 0.2, context.currentTime + decayTime * 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + decayTime);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + decayTime + 0.1);
    });

    // 3. 弦の共鳴効果（低音域強化）
    const createStringResonance = () => {
      const resonanceOsc = context.createOscillator();
      const resonanceGain = context.createGain();
      const resonanceFilter = context.createBiquadFilter();
      
      resonanceOsc.type = 'sine';
      resonanceOsc.frequency.value = frequency * 0.5; // サブハーモニック
      
      resonanceFilter.type = 'bandpass';
      resonanceFilter.frequency.value = frequency * 0.5;
      resonanceFilter.Q.value = frequency < 200 ? 30 : 20; // 低音域はより強い共鳴
      
      resonanceOsc.connect(resonanceFilter);
      resonanceFilter.connect(resonanceGain);
      resonanceGain.connect(masterGain);
      
      const resonanceStrength = frequency < 200 ? 0.15 : 0.1;
      resonanceGain.gain.setValueAtTime(0, context.currentTime);
      resonanceGain.gain.linearRampToValueAtTime(resonanceStrength * velocity, context.currentTime + 0.1);
      resonanceGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + effectiveDuration * 1.5);
      
      resonanceOsc.start(context.currentTime + 0.05);
      resonanceOsc.stop(context.currentTime + effectiveDuration * 1.5);
    };

    createStringResonance();

    // 4. マスターエンベロープ（ピアノの特徴的な減衰カーブ）
    masterGain.gain.setValueAtTime(0, context.currentTime);
    masterGain.gain.linearRampToValueAtTime(velocity * 0.8, context.currentTime + 0.01);
    masterGain.gain.linearRampToValueAtTime(velocity * 0.6, context.currentTime + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(velocity * 0.3, context.currentTime + effectiveDuration * 0.2);
    masterGain.gain.exponentialRampToValueAtTime(velocity * 0.1, context.currentTime + effectiveDuration * 0.6);
    masterGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + effectiveDuration);

  }, []);

  // ノート名から音を再生する関数（ベロシティ対応）
  const playNote = useCallback((note: string, duration = 0.8, velocity = 0.8) => {
    const frequency = noteFrequencies[note];
    if (frequency) {
      playRealisticPianoTone(frequency, duration, velocity);
    } else {
      console.warn(`Unknown note: ${note}`);
    }
  }, [playRealisticPianoTone]);

  // 複数の音を順番に再生する関数
  const playSequence = useCallback(async (notes: string[], interval = 1000, velocity = 0.8) => {
    for (let i = 0; i < notes.length; i++) {
      playNote(notes[i], 0.8, velocity);
      if (i < notes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }, [playNote]);

  // 和音を再生する関数
  const playChord = useCallback((notes: string[], duration = 1.0, velocity = 0.7) => {
    notes.forEach((note, index) => {
      // わずかなタイミングのずれで自然さを演出
      setTimeout(() => {
        playNote(note, duration, velocity * (0.8 + Math.random() * 0.4));
      }, index * 2); // 2msのずれ
    });
  }, [playNote]);

  // オーディオコンテキストを手動で開始する関数
  const initializeAudio = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  return {
    playNote,
    playSequence,
    playChord,
    initializeAudio,
    noteFrequencies,
    isInitialized: () => audioContextRef.current !== null
  };
};

export default useRealisticPianoAudio;