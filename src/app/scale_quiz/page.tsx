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
  const [showMenu, setShowMenu] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const [lastInputTime, setLastInputTime] = useState(0);

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
        notes = ['C4', 'D4', 'E4', 'F4'];
        break;
      case 'high4':
        notes = ['G4', 'A4', 'B4', 'C5'];
        break;
      case 'diatonic8':
        notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        break;
      case 'white12':
        notes = pianoKeys.filter(key => key.type === 'white').map(key => key.note);
        break;
      case 'all18':
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
        playTone(frequency, 0.8);
      }
      
      if (i < currentQuiz.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsPlayingQuiz(false);
  };

  // Handle user input with debounce to prevent double input
  const handleNoteInput = (note: string) => {
    const now = Date.now();
    if (now - lastInputTime < 100) return; // 100ms debounce
    setLastInputTime(now);

    if (!currentQuiz || quizResult === 'correct' || isPlayingQuiz) return;
    
    const availableNotes = getAvailableNotes();
    if (!availableNotes.includes(note)) return;
    
    playNote(note as keyof typeof noteFrequencies, true);
    
    const newAnswer = [...userAnswer, note];
    setUserAnswer(newAnswer);
    
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

  // Handle touch/mouse events properly to prevent double firing
  const handleKeyPress = (note: string, event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    handleNoteInput(note);
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const note = keyMappings[e.key.toLowerCase() as keyof typeof keyMappings];
      if (note) {
        e.preventDefault();
        handleNoteInput(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAnswer, currentQuiz, quizResult, isPlayingQuiz, settings, lastInputTime]);

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
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-white/80 backdrop-blur-sm shadow-sm">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-md bg-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-300 relative"
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-0.5 bg-gray-600"></div>
            <div className="w-4 h-0.5 bg-gray-600"></div>
            <div className="w-4 h-0.5 bg-gray-600"></div>
          </div>
        </button>
        
        <h1 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
          🎹 ピアノ音当てクイズ
        </h1>
        
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="rounded-md bg-indigo-100 px-3 py-2 text-indigo-700 hover:bg-indigo-200"
        >
          ？
        </button>
      </div>

      {/* Menu Modal */}
      {showMenu && (
        <div className="absolute inset-0 bg-black/50 flex items-start justify-start z-50">
          <div className="bg-white rounded-r-lg p-6 h-full min-w-80 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">メニュー</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Score Details */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">スコア</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-gray-800 mb-1">
                    {score.correct} / {score.total}
                  </div>
                  <div className="text-sm text-gray-600">
                    正答率: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">設定</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">音数設定</label>
                    <div className="flex gap-3">
                      <div>
                        <label className="text-xs text-gray-500">最小</label>
                        <select
                          value={settings.minNotes}
                          onChange={(e) => setSettings(prev => ({ ...prev, minNotes: parseInt(e.target.value) }))}
                          className="ml-1 px-2 py-1 border rounded text-sm"
                        >
                          <option value={1}>1音</option>
                          <option value={2}>2音</option>
                          <option value={3}>3音</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">最大</label>
                        <select
                          value={settings.maxNotes}
                          onChange={(e) => setSettings(prev => ({ ...prev, maxNotes: parseInt(e.target.value) }))}
                          className="ml-1 px-2 py-1 border rounded text-sm"
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

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">音の範囲</label>
                    <select
                      value={settings.noteRange}
                      onChange={(e) => setSettings(prev => ({ ...prev, noteRange: e.target.value }))}
                      className="w-full px-3 py-2 border rounded text-sm"
                    >
                      <option value="basic4">基本4音：ド・レ・ミ・ファ（超簡単）</option>
                      <option value="high4">高音4音：ソ・ラ・シ・ド（超簡単）</option>
                      <option value="diatonic8">ドレミファソラシド（簡単）</option>
                      <option value="white12">白鍵のみ（中級）</option>
                      <option value="all18">全ての音（上級）</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="border-t pt-4">
                <button
                  onClick={() => router.push("/")}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  ← タイトルに戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">遊び方</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-sm space-y-2">
              <p>1. 「新しい問題」で問題作成</p>
              <p>2. 「問題を聞く」で音列再生</p>
              <p>3. 鍵盤で順番に音を入力</p>
              <p>4. 全音入力で自動採点</p>
              <p>5. ハンバーガーメニュー（三）で設定変更</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-3 gap-3">
        {/* Score and Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Simple Score */}
          <div className="bg-white rounded-lg shadow-sm px-4 py-2">
            <div className="text-lg font-bold text-gray-800">
              {score.correct} / {score.total}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <button
              onClick={generateQuiz}
              disabled={isPlayingQuiz}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 font-medium"
            >
              新しい問題
            </button>
            
            <button
              onClick={playQuizSequence}
              disabled={!currentQuiz || isPlayingQuiz}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-1"
            >
              ▶ {isPlayingQuiz ? '再生中' : '問題を聞く'}
            </button>
            
            {currentQuiz && (
              <>
                <button
                  onClick={resetAnswer}
                  disabled={isPlayingQuiz}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  リセット
                </button>
                
                <button
                  onClick={toggleShowAnswer}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  {showAnswer ? '答えを隠す' : '答えを見る'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Display */}
        {currentQuiz && (
          <div className="text-center">
            {/* User Answer */}
            <div className="font-mono text-lg bg-white rounded p-2 shadow-sm mb-2">
              {userAnswer.length > 0 ? userAnswer.join(' → ') : '(鍵盤で音を入力してください)'}
            </div>
            
            {/* Result */}
            {quizResult && (
              <div className={`text-xl font-bold mb-2 ${
                quizResult === 'correct' ? 'text-green-600' : 'text-red-600'
              }`}>
                {quizResult === 'correct' ? '🎉 正解！' : '❌ 不正解'}
              </div>
            )}

            {/* Answer Display */}
            {showAnswer && (
              <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                <strong>正解:</strong> {currentQuiz.join(' → ')}
              </div>
            )}
          </div>
        )}

        {/* Piano Keyboard */}
        <div className="flex-1 flex justify-center items-end">
          <div className="relative bg-gray-200 p-2 rounded-xl shadow-lg overflow-x-auto">
            <div className="relative flex justify-center min-w-[500px] max-w-[90vw] md:min-w-[600px] lg:min-w-[700px] xl:min-w-[800px]">
              {/* White keys */}
              <div className="flex">
                {pianoKeys.filter(key => key.type === 'white').map((key, index) => {
                  const isActive = Array.from(activeKeys).some(activeKey => activeKey.startsWith(key.note));
                  const isInAnswer = userAnswer.includes(key.note);
                  const isDisabled = isKeyDisabled(key.note);
                  
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
                      onTouchStart={(e) => {
                        if (!isDisabled) handleKeyPress(key.note, e);
                      }}
                      onMouseDown={(e) => {
                        if (!isDisabled) handleKeyPress(key.note, e);
                      }}
                      disabled={isDisabled || isPlayingQuiz}
                      className={`
                        w-12 h-36 md:w-16 md:h-48 lg:w-20 lg:h-56 xl:w-24 xl:h-64 border border-gray-300 rounded-b-xl
                        transition-all duration-300 flex flex-col justify-end items-center pb-2 md:pb-3 lg:pb-4
                        ${keyColor}
                        ${isActive ? 'animate-pulse' : ''}
                        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer'}
                        touch-manipulation
                      `}
                    >
                      <span className={`text-xs md:text-sm lg:text-base font-bold mb-1 ${isDisabled ? 'text-gray-300' : 'text-gray-800'}`}>
                        {key.key?.toUpperCase()}
                      </span>
                      <span className={`text-xs md:text-sm ${isDisabled ? 'text-gray-300' : 'text-gray-600'}`}>
                        {key.solfege}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Black keys */}
              <div className="absolute top-0 left-0 flex">
                {pianoKeys.filter(key => key.type === 'black').map((key) => {
                  const whiteKeyIndex = pianoKeys.filter(k => k.type === 'white' && 
                    pianoKeys.indexOf(k) < pianoKeys.indexOf(key)).length;
                  
                  // Calculate left offset for mobile (will be overridden by CSS for larger screens)
                  const leftOffset = (whiteKeyIndex * 48) - 18;
                  
                  const isActive = Array.from(activeKeys).some(activeKey => activeKey.startsWith(key.note));
                  const isInAnswer = userAnswer.includes(key.note);
                  const isDisabled = isKeyDisabled(key.note);
                  
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
                      onTouchStart={(e) => {
                        if (!isDisabled) handleKeyPress(key.note, e);
                      }}
                      onMouseDown={(e) => {
                        if (!isDisabled) handleKeyPress(key.note, e);
                      }}
                      disabled={isDisabled || isPlayingQuiz}
                      style={{ left: `${leftOffset + 4}px` }}
                      className={`
                        absolute w-8 h-24 md:w-12 md:h-32 lg:w-14 lg:h-40 xl:w-16 xl:h-44 border border-gray-800 rounded-b-lg shadow-2xl text-white
                        transition-all duration-300 flex flex-col justify-end items-center pb-2 md:pb-3 z-10
                        ${keyColor}
                        ${isActive ? 'animate-pulse' : ''}
                        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-800 active:bg-gray-700 cursor-pointer'}
                        touch-manipulation
                      `}
                    >
                      <span className={`text-xs md:text-sm font-bold bg-black bg-opacity-50 px-1 rounded mb-1 ${isDisabled ? 'text-gray-300' : 'text-white'}`}>
                        {key.key?.toUpperCase()}
                      </span>
                      <span className={`text-xs md:text-sm ${isDisabled ? 'text-gray-300' : ''}`}>
                        {key.solfege}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoQuizGame;