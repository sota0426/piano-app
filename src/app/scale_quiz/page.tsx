"use client"

import Modal from '@/components/Modal';
import usePianoAudio from '@/components/PianoAudio';
import PianoKeyboard, { PianoKeys } from '@/components/PianoKeyboard';
import GameHeader from '@/components/scale_quiz/GameHeader';
import GameMenu from '@/components/scale_quiz/GameMenu';
import ScoreDisplay from '@/components/scale_quiz/ScoreDisplay';
import React, { useState, useEffect, useCallback } from 'react';

// Main PianoQuizGame Component
const PianoQuizGame = () => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [currentQuiz, setCurrentQuiz] = useState<string[] | null>(null);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<null | 'correct' | 'incorrect'>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlayingQuiz, setIsPlayingQuiz] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [lastInputTime, setLastInputTime] = useState(0);
  
  const { playNote, playSequence, initializeAudio } = usePianoAudio();
  
  const [settings, setSettings] = useState({
    minNotes: 1,
    maxNotes: 3,
    noteRange: 'basic4'
  });

  const keyMappings = {
    'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4',
    'f': 'F4', 't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4', 
    'u': 'A#4', 'j': 'B4', 'k': 'C5', 'o': 'C#5', 'l': 'D5',
    'p': 'D#5', ';': 'E5', "'": 'F5'
  };


        // ✅ 正解時、2秒後に次の問題を出す
    useEffect(() => {
      if (quizResult === 'correct') {
        const timer = setTimeout(() => {
          generateQuiz();
        }, 2000);

        return () => clearTimeout(timer);
      }
    }, [quizResult]);
    
  const getAvailableNotes = () => {
    switch (settings.noteRange) {
      case 'basic4': return ['C4', 'D4', 'E4', 'F4'];
      case 'high4': return ['G4', 'A4', 'B4', 'C5'];
      case 'diatonic8': return ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
      case 'white12': return PianoKeys.filter(key => key.type === 'white').map(key => key.note);
      case 'all18': return PianoKeys.map(key => key.note);
      default: return ['C4', 'D4', 'E4', 'F4'];
    }
  };

  const playNoteWithVisual = useCallback((note:string) => {
    playNote(note, 0.8);
    
    const noteKey = `${note}-${Date.now()}`;
    setActiveKeys(prev => new Set([...prev, noteKey]));
    
    setTimeout(() => {
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteKey);
        return newSet;
      });
    }, 300);
  }, [playNote]);

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
    
  };

  const playQuizSequence = async () => {
    if (!currentQuiz) return;
    
    setIsPlayingQuiz(true);
    await initializeAudio();
    await playSequence(currentQuiz, 1000);
    setIsPlayingQuiz(false);
  };

  const handleNoteInput = (note:string) => {
    const now = Date.now();
    if (now - lastInputTime < 100) return;
    setLastInputTime(now);

    if (!currentQuiz || quizResult === 'correct' || isPlayingQuiz) return;
    
    const availableNotes = getAvailableNotes();
    if (!availableNotes.includes(note)) return;
    
    playNoteWithVisual(note);
    
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

  const handleKeyPress = (note: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    handleNoteInput(note);
  };

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

  const resetAnswer = () => {
    setUserAnswer([]);
    setQuizResult(null);
  };

  const toggleShowAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const getDisabledKeys = () => {
    const availableNotes = getAvailableNotes();
    return PianoKeys.map(key => key.note).filter(note => !availableNotes.includes(note));
  };

  const goBackHome = () => {
    console.log("タイトルに戻る");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      <GameHeader
        title="ピアノ音当てクイズ"
        onMenuClick={() => setShowMenu(true)}
        onInstructionsClick={() => setShowInstructions(true)}
      />

      <GameMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        score={score}
        settings={settings}
        onSettingsChange={setSettings}
        onGoHome={goBackHome}
      />

      <Modal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title="遊び方"
        size="medium"
      >
        <div className="text-sm space-y-2">
          <p>1. 「新しい問題」で問題作成</p>
          <p>2. 「問題を聞く」で音列再生</p>
          <p>3. 鍵盤で順番に音を入力</p>
          <p>4. 全音入力で自動採点</p>
          <p>5. ハンバーガーメニュー（三）で設定変更</p>
        </div>
      </Modal>

      <div className="flex-1 flex flex-col p-3 gap-3">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <ScoreDisplay score={score} />

          <div className="flex gap-2 flex-wrap">
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

        {currentQuiz && (
          <div className="text-center">
            <div className="font-mono text-lg bg-white rounded p-2 shadow-sm mb-2">
              {userAnswer.length > 0 ? userAnswer.join(' → ') : '(鍵盤で音を入力してください)'}
            </div>
            
            
            {quizResult && (
              <div className={`text-xl font-bold mb-2 ${
                quizResult === 'correct' ? 'text-green-600' : 'text-red-600'
              }`}>
                {quizResult === 'correct' ? '🎉 正解！' : '❌ 不正解'}
              </div>
            )}

            {showAnswer && (
              <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                <strong>正解:</strong> {currentQuiz.join(' → ')}
              </div>
            )}
          </div>
        )}


        <PianoKeyboard
          activeKeys={activeKeys}
          userAnswer={userAnswer}
          disabledKeys={getDisabledKeys()}
          isPlayingQuiz={isPlayingQuiz}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
};

export default PianoQuizGame;