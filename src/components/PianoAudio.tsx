import { useRef, useEffect, useCallback } from 'react';

const useRealisticPianoAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // 音の周波数定義
  const noteFrequencies: { [note: string]: number } = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
    'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33,
    'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99
  };

  // ピアノの音域による音色の違いを定義
  const getPianoCharacteristics = (frequency: number) => {
    if (frequency < 300) {
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

  // 弦の共鳴をシミュレート
  const createStringResonance = (context: AudioContext, frequency: number, duration: number) => {
    const resonator = context.createIIRFilter([0.00006, 0.0, -0.00006], [1.0, -1.82269, 0.83478]);
    
    // 弦の共振周波数に調整
    const q = 30; // Q値を高くして共振を強調
    const resonantFreq = frequency * 2; // 倍音で共振
    
    return resonator;
  };

  // ピアノらしい音の再生（大幅改良版）
  const playRealisticPianoTone = useCallback((frequency: number, duration = 1.2, velocity = 0.8) => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    const characteristics = getPianoCharacteristics(frequency);
    const effectiveDuration = duration * characteristics.sustain;

    // メインの音響チェーンを作成
    const masterGain = context.createGain();
    
    // リバーブ作成
    const convolver = context.createConvolver();
    convolver.buffer = createReverbImpulse(context, 2.0, 3.0);
    
    const dryGain = context.createGain();
    const wetGain = context.createGain();
    
    dryGain.gain.value = 0.7;
    wetGain.gain.value = 0.3;
    
    masterGain.connect(dryGain);
    masterGain.connect(convolver);
    convolver.connect(wetGain);
    
    dryGain.connect(context.destination);
    wetGain.connect(context.destination);

    // 1. ハンマーアタック音（より詳細）
    const createHammerNoise = () => {
      const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.05, context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < noiseData.length; i++) {
        const t = i / context.sampleRate;
        const envelope = Math.exp(-t * 50); // 急激な減衰
        noiseData[i] = (Math.random() * 2 - 1) * envelope * characteristics.noiseLevel * velocity;
      }
      
      const noiseSource = context.createBufferSource();
      const noiseGain = context.createGain();
      const noiseFilter = context.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = frequency * 8;
      noiseFilter.Q.value = 2;
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      
      noiseGain.gain.setValueAtTime(velocity * 0.5, context.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);
      
      noiseSource.start(context.currentTime);
      noiseSource.stop(context.currentTime + 0.05);
    };

    createHammerNoise();

    // 2. 弦の倍音構造（ピアノの実際の倍音比率に基づく）
    const harmonics = [
      { freq: frequency, gain: 1.0, detune: 0, type: 'sawtooth' as OscillatorType },
      { freq: frequency * 2, gain: 0.5, detune: -2, type: 'sawtooth' as OscillatorType },
      { freq: frequency * 3, gain: 0.25, detune: 1, type: 'triangle' as OscillatorType },
      { freq: frequency * 4, gain: 0.15, detune: -1, type: 'triangle' as OscillatorType },
      { freq: frequency * 5, gain: 0.1, detune: 2, type: 'sine' as OscillatorType },
      { freq: frequency * 6, gain: 0.08, detune: -1.5, type: 'sine' as OscillatorType },
      { freq: frequency * 7, gain: 0.06, detune: 1.2, type: 'sine' as OscillatorType },
      { freq: frequency * 8, gain: 0.04, detune: -0.8, type: 'sine' as OscillatorType },
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

    // 3. 弦の共鳴効果
    const createStringResonance = () => {
      const resonanceOsc = context.createOscillator();
      const resonanceGain = context.createGain();
      const resonanceFilter = context.createBiquadFilter();
      
      resonanceOsc.type = 'sine';
      resonanceOsc.frequency.value = frequency * 0.5; // サブハーモニック
      
      resonanceFilter.type = 'bandpass';
      resonanceFilter.frequency.value = frequency * 0.5;
      resonanceFilter.Q.value = 20; // 高いQ値で共鳴効果
      
      resonanceOsc.connect(resonanceFilter);
      resonanceFilter.connect(resonanceGain);
      resonanceGain.connect(masterGain);
      
      resonanceGain.gain.setValueAtTime(0, context.currentTime);
      resonanceGain.gain.linearRampToValueAtTime(0.1 * velocity, context.currentTime + 0.1);
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