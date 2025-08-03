"use client"

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';

const PianoQuizGame = () => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [keyAnimations, setKeyAnimations] = useState(new Map());
  const [currentQuiz, setCurrentQuiz] = useState<string[] | null>(null);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlayingQuiz, setIsPlayingQuiz] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const router = useRouter();
  
  // Settings
  const [settings, setSettings] = useState({
    minNotes: 1,
    maxNotes: 3,
    noteRange: 'basic4' // 'basic4', 'high4', 'diatonic8', 'white12', 'all18'
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);

  // Note frequencies (Web Audio API)
  const noteFrequencies: { [note: string]: number } = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
    'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33,
    'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99
  };

  // Piano key mappings
  const keyMappings = {
    'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4',
    'f': 'F4', 't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4', 
    'u': 'A#4', 'j': 'B4', 'k': 'C5', 'o': 'C#5', 'l': 'D5',
    'p': 'D#5', ';': 'E5', ':': 'F5'
  };

  // All piano keys for display
  const pianoKeys = [
    { note: 'C4', type: 'white', key: 'a', solfege: 'ド' },
    { note: 'C#4', type: 'black', key: 'w', solfege: 'ド#' },
    { note: 'D4', type: 'white', key: 's', solfege: 'レ' },
    { note: 'D#4', type: 'black', key: 'e', solfege: 'レ#' },
    { note: 'E4', type: 'white', key: 'd', solfege: 'ミ' },
    { note: 'F4', type: 'white', key: 'f', solfege: 'ファ' },
    { note: 'F#4', type: 'black', key: 't', solfege: 'ファ#' },
    { note: 'G4', type: 'white', key: 'g', solfege: 'ソ' },
    { note: 'G#4', type: 'black', key: 'y', solfege: 'ソ#' },
    { note: 'A4', type: 'white', key: 'h', solfege: 'ラ' },
    { note: 'A#4', type: 'black', key: 'u', solfege: 'ラ#' },
    { note: 'B4', type: 'white', key: 'j', solfege: 'シ' },
    { note: 'C5', type: 'white', key: 'k', solfege: 'ド' },
    { note: 'C#5', type: 'black', key: 'o', solfege: 'ド#' },
    { note: 'D5', type: 'white', key: 'l', solfege: 'レ' },
    { note: 'D#5', type: 'black', key: 'p', solfege: 'レ#' },
    { note: 'E5', type: 'white', key: ';', solfege: 'ミ' },
    { note: 'F5', type: 'white', key: "'", solfege: 'ファ' }
  ];

  // Get available notes based on settings
  const getAvailableNotes = () => {
    let notes = [];
    
    switch (settings.noteRange) {
      case 'basic4':
        // 基本の4音：ド・レ・ミ・ファ
        notes = ['C4', 'D4', 'E4', 'F4'];
        break;
      case 'high4':
        // 高音の4音：ソ・ラ・シ・ド
        notes = ['G4', 'A4', 'B4', 'C5'];
        break;
      case 'diatonic8':
        // ドレミファソラシド（全音階8音）
        notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        break;
      case 'white12':
        // 白鍵のみ（12音）
        notes = pianoKeys.filter(key => key.type === 'white').map(key => key.note);
        break;
      case 'all18':
        // 全ての音（白鍵 + 黒鍵、18音）
        notes = pianoKeys.map(key => key.note);
        break;
      default:
        notes = ['C4', 'D4', 'E4', 'F4'];
    }
    
    return notes;
  };

  // Initialize Web Audio API
  useEffect(() => {
    const initAudio = () => {
      try {
        const win = window as typeof window & { webkitAudioContext?: typeof AudioContext };
        audioContextRef.current = new (win.AudioContext || win.webkitAudioContext!)();
        console.log("Web Audio API initialized successfully");
      } catch (error) {
        console.error('Failed to initialize Web Audio API:', error);
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

  // Play tone using Web Audio API
  const playTone = (frequency: number, duration = 0.5) => {
    if (!audioContextRef.current) return;

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + duration * 0.1);
    gainNode.gain.linearRampToValueAtTime(0.15, context.currentTime + duration * 0.8);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  };

  // Play note with visual feedback (only for user input, not quiz playback)
  const playNote = useCallback((note: keyof typeof noteFrequencies, showVisual = true) => {
    const frequency = noteFrequencies[note];
    if (frequency) {
      playTone(frequency, 0.8);
      
      if (showVisual) {
        const noteKey = `${note}-${Date.now()}`;
        setActiveKeys(prev => new Set([...prev, noteKey]));
        setKeyAnimations(prev => new Map(prev.set(note, Date.now())));
        
        setTimeout(() => {
          setActiveKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(noteKey);
            return newSet;
          });
        }, 300);
      }
    }
  }, []);

  // Generate new quiz
  const generateQuiz = () => {
    const availableNotes = getAvailableNotes();
    const numNotes = Math.floor(Math.random() * (settings.maxNotes - settings.minNotes + 1)) + settings.minNotes;
    const quizNotes = [];
    
    for (let i = 0; i < numNotes; i++) {
      const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
      quizNotes.push(randomNote);
    }
    
    setCurrentQuiz(quizNotes);
    setUserAnswer([]);
    setQuizResult(null);
    setShowAnswer(false);
    console.log('Generated quiz:', quizNotes);
  };

  // Play quiz sequence (NO visual feedback to hide answer)
  const playQuizSequence = async () => {
    if (!currentQuiz || !audioContextRef.current) return;
    
    setIsPlayingQuiz(true);
    
    for (let i = 0; i < currentQuiz.length; i++) {
      const note = currentQuiz[i];
      const frequency = noteFrequencies[note];
      
      if (frequency) {
        // Play sound without visual feedback
        playTone(frequency, 0.8);
      }
      
      // Wait between notes
      if (i < currentQuiz.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Wait a bit after the last note
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsPlayingQuiz(false);
  };

  // Handle user input
  const handleNoteInput = (note: string) => {
    if (!currentQuiz || quizResult === 'correct' || isPlayingQuiz) return;
    
    // Check if this note is available in current settings
    const availableNotes = getAvailableNotes();
    if (!availableNotes.includes(note)) return;
    
    playNote(note as keyof typeof noteFrequencies, true); // Show visual feedback for user input
    
    const newAnswer = [...userAnswer, note];
    setUserAnswer(newAnswer);
    
    // Check if answer is complete
    if (newAnswer.length === currentQuiz.length) {
      const isCorrect = newAnswer.every((note, index) => note === currentQuiz[index]);
      
      if (isCorrect) {
        setQuizResult('correct');
        setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      } else {
        setQuizResult('incorrect');
        setScore(prev => ({ ...prev, total: prev.total + 1 }));
      }
    }
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const note = keyMappings[e.key.toLowerCase() as keyof typeof keyMappings];
      if (note) {
        handleNoteInput(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAnswer, currentQuiz, quizResult, isPlayingQuiz, settings]);

  // Reset user answer
  const resetAnswer = () => {
    setUserAnswer([]);
    setQuizResult(null);
  };

  // Toggle show answer
  const toggleShowAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  // Get note range description
  const getNoteRangeDescription = () => {
    switch (settings.noteRange) {
      case 'basic4': return '基本4音（ド・レ・ミ・ファ）';
      case 'high4': return '高音4音（ソ・ラ・シ・ド）';
      case 'diatonic8': return 'ドレミファソラシド（8音）';
      case 'white12': return '白鍵のみ（12音）';
      case 'all18': return '全ての音（18音）';
      default: return '基本4音（ド・レ・ミ・ファ）';
    }
  };

  // Check if a key should be disabled based on settings
  const isKeyDisabled = (note: string) => {
    const availableNotes = getAvailableNotes();
    return !availableNotes.includes(note);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
          >
            ← タイトルに戻る
          </button>                      
        <h1 className="text-4xl font-bold text-indigo-800 text-center mb-8 mt-12">
          🎹 ピアノ音当てクイズ
        </h1>

        
        {/* Score Display */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">
              スコア: {score.correct} / {score.total}
            </div>
            <div className="text-sm text-gray-600">
              正答率: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-md p-4" style={{width: '736px'}}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">設定</h3>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
              >
                {showSettings ? '閉じる' : '設定を変更'}
              </button>
            </div>
            
            {showSettings && (
              <div className="space-y-4 border-t pt-4">
                {/* Number of notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    出題音数
                  </label>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm text-gray-600">最小</label>
                      <select
                        value={settings.minNotes}
                        onChange={(e) => setSettings(prev => ({ ...prev, minNotes: parseInt(e.target.value) }))}
                        className="ml-2 px-2 py-1 border rounded"
                      >
                        <option value={1}>1音</option>
                        <option value={2}>2音</option>
                        <option value={3}>3音</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">最大</label>
                      <select
                        value={settings.maxNotes}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxNotes: parseInt(e.target.value) }))}
                        className="ml-2 px-2 py-1 border rounded"
                      >
                        <option value={1}>1音</option>
                        <option value={2}>2音</option>
                        <option value={3}>3音</option>
                        <option value={4}>4音</option>
                        <option value={5}>5音</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Note range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    使用する音の範囲
                  </label>
                  <select
                    value={settings.noteRange}
                    onChange={(e) => setSettings(prev => ({ ...prev, noteRange: e.target.value }))}
                    className="px-3 py-2 border rounded w-full"
                  >
                    <option value="basic4">基本4音：ド・レ・ミ・ファ（超簡単）</option>
                    <option value="high4">高音4音：ソ・ラ・シ・ド（超簡単）</option>
                    <option value="diatonic8">ドレミファソラシド（簡単）</option>
                    <option value="white12">白鍵のみ（中級）</option>
                    <option value="all18">全ての音（上級）</option>
                  </select>
                </div>
              </div>
            )}
            
            {!showSettings && (
              <div className="text-sm text-gray-600">
                現在の設定: {settings.minNotes}～{settings.maxNotes}音, {getNoteRangeDescription()}
              </div>
            )}
          </div>
        </div>

        {/* Quiz Controls */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-6" style={{width: '736px'}}>
            <div className="flex gap-4 items-center justify-center mb-4">
              <button
                onClick={generateQuiz}
                disabled={isPlayingQuiz}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                新しい問題
              </button>
              
              <button
                onClick={playQuizSequence}
                disabled={!currentQuiz || isPlayingQuiz}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                {isPlayingQuiz ? '再生中...' : '問題を聞く'}
              </button>
              
              {currentQuiz && (
                <button
                  onClick={resetAnswer}
                  disabled={isPlayingQuiz}
                  className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  答えをリセット
                </button>
              )}
            </div>

            {/* Quiz Status */}
            {currentQuiz && (
              <div className="text-center">
                <div className="mb-4">
                  <span className="text-lg font-medium text-gray-700">
                    問題: {currentQuiz.length}音の音列
                  </span>
                </div>
                
                <div className="mb-4">
                  <span className="text-md text-gray-600">
                    あなたの答え ({userAnswer.length}/{currentQuiz.length}): 
                  </span>
                  <span className="ml-2 font-mono text-lg">
                    {userAnswer.length > 0 ? userAnswer.join(' → ') : '(まだ入力されていません)'}
                  </span>
                </div>

                {/* Result Display */}
                {quizResult && (
                  <div className={`text-2xl font-bold mb-4 ${
                    quizResult === 'correct' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {quizResult === 'correct' ? '🎉 正解！' : '❌ 不正解'}
                  </div>
                )}

                {/* Show Answer Button */}
                {currentQuiz && (
                  <button
                    onClick={toggleShowAnswer}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    {showAnswer ? '答えを隠す' : '答えを見る'}
                  </button>
                )}

                {/* Answer Display */}
                {showAnswer && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <span className="text-md font-medium text-gray-700">
                      正解: 
                    </span>
                    <span className="ml-2 font-mono text-lg text-gray-800">
                      {currentQuiz.join(' → ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!currentQuiz && (
              <div className="text-center text-gray-600">
                「新しい問題」ボタンを押してクイズを開始してください
              </div>
            )}
          </div>
        </div>

        {/* Piano Keyboard */}
        <div className="flex justify-center px-8 mb-8">
          <div className="relative bg-gray-200 p-4 rounded-2xl shadow-lg" style={{width: '736px'}}>
            <div className="text-center mb-4 text-gray-700 font-medium">
              キーボードまたはクリックで音を入力
            </div>
            <div className="relative">
              {/* White keys */}
              <div className="flex">
                {pianoKeys.filter(key => key.type === 'white').map((key) => {
                  const isActive = Array.from(activeKeys).some(activeKey => activeKey.startsWith(key.note));
                  const isInAnswer = userAnswer.includes(key.note);
                  const isDisabled = isKeyDisabled(key.note);
                  const animationKey = keyAnimations.get(key.note) || 0;
                  
                  let keyColor = 'bg-white';
                  if (isDisabled) {
                    keyColor = 'bg-gray-100 text-gray-300 border-gray-200';
                  } else if (isActive) {
                    keyColor = 'bg-blue-200 border-blue-400';
                  } else if (isInAnswer) {
                    keyColor = 'bg-yellow-100 border-yellow-400';
                  }
                  
                  return (
                    <button
                      key={key.note}
                      onMouseDown={() => !isDisabled && handleNoteInput(key.note)}
                      disabled={isDisabled || isPlayingQuiz}
                      className={`
                        w-16 h-64 border border-gray-300 rounded-b-xl
                        transition-all duration-300 flex flex-col justify-end items-center pb-4
                        ${keyColor}
                        ${isActive ? 'animate-pulse' : ''}
                        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer'}
                      `}
                      style={{
                        animationDuration: '0.6s',
                        animationIterationCount: '1',
                      }}
                    >
                      <span className={`text-sm font-bold mb-1 ${isDisabled ? 'text-gray-300' : 'text-gray-800'}`}>
                        {key.key?.toUpperCase()}
                      </span>
                      <span className={`text-xs opacity-80 ${isDisabled ? 'text-gray-300' : 'text-gray-600'}`}>
                        {key.note}
                      </span>
                      <span className={`text-xs opacity-80 ${isDisabled ? 'text-gray-300' : 'text-gray-600'}`}>
                        {key.solfege}
                      </span>                    </button>
                  );
                })}
              </div>

              {/* Black keys */}
              <div className="absolute top-0 left-0 flex">
                {pianoKeys.filter(key => key.type === 'black').map((key) => {
                  const whiteKeyIndex = pianoKeys.filter(k => k.type === 'white' && 
                    pianoKeys.indexOf(k) < pianoKeys.indexOf(key)).length;
                  
                  let leftOffset = (whiteKeyIndex * 64) - 24;
                  
                  const isActive = Array.from(activeKeys).some(activeKey => activeKey.startsWith(key.note));
                  const isInAnswer = userAnswer.includes(key.note);
                  const isDisabled = isKeyDisabled(key.note);
                  const animationKey = keyAnimations.get(key.note) || 0;
                  
                  let keyColor = 'bg-black';
                  if (isDisabled) {
                    keyColor = 'bg-gray-400 text-gray-300 border-gray-500';
                  } else if (isActive) {
                    keyColor = 'bg-blue-600 border-blue-500';
                  } else if (isInAnswer) {
                    keyColor = 'bg-yellow-600 border-yellow-500';
                  }
                  
                  return (
                    <button
                      key={key.note}
                      onMouseDown={() => !isDisabled && handleNoteInput(key.note)}
                      disabled={isDisabled || isPlayingQuiz}
                      style={{ left: `${leftOffset + 4}px` }}
                      className={`
                        absolute w-12 h-40 border border-gray-800 rounded-b-lg shadow-2xl text-white
                        transition-all duration-300 flex flex-col justify-end items-center pb-4 z-10
                        ${keyColor}
                        ${isActive ? 'animate-pulse' : ''}
                        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-800 active:bg-gray-700 cursor-pointer'}
                      `}
                    >
                      <span className={`text-xs font-bold bg-black bg-opacity-50 px-1 py-0.5 rounded mb-1 ${isDisabled ? 'text-gray-300' : 'text-white'}`}>
                        {key.key?.toUpperCase()}
                      </span>
                      <span className={`text-xs opacity-75 ${isDisabled ? 'text-gray-300' : ''}`}>
                        {key.note}
                      </span>
                      <span className={`text-xs opacity-75 ${isDisabled ? 'text-gray-300' : ''}`}>
                        {key.solfege}
                      </span>                    </button>
                  );
                })}l
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex justify-center px-8">
          <div className="bg-white rounded-lg shadow-md p-6" style={{width: '736px'}}>
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">遊び方</h3>
            <div className="text-gray-700 space-y-2">
              <p>1. 設定で難易度を調整できます（音数・音の範囲）</p>
              <p>2. グレーのキーは現在の設定では使用されません</p>
              <p>3. 「新しい問題」ボタンで問題が出題されます</p>
              <p>4. 「問題を聞く」ボタンで音列を再生します（何度でも可能）</p>
              <p>5. 有効なピアノキーをクリック/キーボードで順番に音を入力</p>
              <p>6. 全ての音を入力すると自動で採点されます</p>
              <p>7. 正解すると🎉、不正解だと❌が表示されます</p>
              <p>8. 何度でもチャレンジできます！</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoQuizGame;