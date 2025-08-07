"use client"

import KeyboardInput from '@/components/KeyboardInput';
import Modal from '@/components/Modal';
import usePianoAudio from '@/components/PianoAudio';
import ExtendedPianoKeyboard, { ExtendedPianoKeys } from '@/components/PianoKeyboard';
import GameHeader from '@/components/scale_quiz/GameHeader';
import GameMenu from '@/components/scale_quiz/GameMenu';
import ScoreDisplay from '@/components/scale_quiz/ScoreDisplay';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';

type Hand = 'left' | 'right';

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
  const [buttonLocked, setButtonLocked] = useState(false);

  const router = useRouter();

  // 左右手モード追加
  const [activeHand, setActiveHand] = useState<Hand>('right');
  
  const { playNote, playSequence, initializeAudio } = usePianoAudio();
  
  const [settings, setSettings] = useState({
    minNotes: 1,
    maxNotes: 3,
    noteRange: 'basic4'
  });

  const getAvailableNotes = () => {
    // 手に応じて適切な音域のキーをフィルタリング
    let availableKeys = ExtendedPianoKeys.filter(key => {
      if (activeHand === 'left') {
        return key.hand === 'left' || key.hand === 'both';
      } else {
        return key.hand === 'right' || key.hand === 'both';
      }
    });

    switch (settings.noteRange) {
      case 'basic4':
        if (activeHand === 'left') {
          return ['C3', 'D3', 'E3', 'F3'];
        } else {
          return ['C4', 'D4', 'E4', 'F4'];
        }
      case 'high4':
        if (activeHand === 'left') {
          return ['G3', 'A3', 'B3', 'C4'];
        } else {
          return ['G4', 'A4', 'B4', 'C5'];
        }
      case 'diatonic8':
        if (activeHand === 'left') {
          return ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];
        } else {
          return ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        }
      case 'white12':
        return availableKeys.filter(key => key.type === 'white').map(key => key.note);
      case 'all18':
        return availableKeys.map(key => key.note);
      default:
        if (activeHand === 'left') {
          return ['C3', 'D3', 'E3', 'F3'];
        } else {
          return ['C4', 'D4', 'E4', 'F4'];
        }
    }
  };

  const playNoteWithVisual = useCallback((note: string) => {
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
  if (buttonLocked) return;
  setButtonLocked(true); // 処理開始直後にロック

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

  // 少し待ってからロック解除
  setTimeout(() => {
    setButtonLocked(false);
  }, 300);
};

  const playQuizSequence = async () => {
    if (!currentQuiz) return;
    
    setIsPlayingQuiz(true);
    await initializeAudio();
    await playSequence(currentQuiz, 1000);
    setIsPlayingQuiz(false);
  };

  const handleNoteInput = (note: string) => {

    const now = Date.now();
    if (now - lastInputTime < 100) return;
    setLastInputTime(now);

    if (!currentQuiz || quizResult === 'correct' || isPlayingQuiz) return;
    
    const availableNotes = getAvailableNotes();
    if (!availableNotes.includes(note)) return;
    
    playNoteWithVisual(note);

    const newAnswer = [...userAnswer, note];
    if(newAnswer.length > 4) return;

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

  const resetAnswer = () => {
    setUserAnswer([]);
    setQuizResult(null);
  };

  const toggleShowAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const getDisabledKeys = () => {
    const availableNotes = getAvailableNotes();
    return ExtendedPianoKeys.map(key => key.note).filter(note => !availableNotes.includes(note));
  };


  // 手が変更されたときに新しい問題を生成
  useEffect(() => {
    if (currentQuiz) {
      generateQuiz();
    }
  }, [activeHand]);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
            
      <KeyboardInput onNoteInput={handleNoteInput} enabled={!isPlayingQuiz} hand={activeHand}/>

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
        onGoHome={() => router.push("/")}
        activeHand={activeHand}
        setActiveHand={setActiveHand}
      />

      <Modal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title="遊び方"
        size="medium"
      >
        <div className="text-sm space-y-2">
          <p>1. 左手・右手モードを選択</p>
          <p>2. 「新しい問題」で問題作成</p>
          <p>3. 「問題を聞く」で音列再生</p>
          <p>4. 鍵盤で順番に音を入力</p>
          <p>5. 全音入力で自動採点</p>
          <p>6. ハンバーガーメニュー（三）で設定変更</p>
        </div>
      </Modal>

      <div className="flex-1 flex flex-col p-2 sm:p-3 gap-2 sm:gap-3">
        {/* 手の切り替えと操作ボタン */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">


          {/* スコア表示 */}
          <div className="order-2 sm:order-2">
            <ScoreDisplay score={score} />
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-1 sm:gap-2 flex-wrap order-3 sm:order-3">
            <button
              onClick={generateQuiz}
              disabled={isPlayingQuiz}
              className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 font-medium text-sm"
            >
              新しい問題
            </button>
            
            <button
              onClick={playQuizSequence}
              disabled={!currentQuiz || isPlayingQuiz}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-1 text-sm"
            >
              ▶ {isPlayingQuiz ? '再生中' : '問題を聞く'}
            </button>
            
            {currentQuiz && (
              <>
                <button
                  onClick={resetAnswer}
                  disabled={isPlayingQuiz}
                  className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 text-sm"
                >
                  リセット
                </button>
                
                <button
                  onClick={toggleShowAnswer}
                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  {showAnswer ? '答えを隠す' : '答えを見る'}
                </button>
              </>
            )}
          {currentQuiz && (
            <div className="px-3 py-2text-center">
              <div className="font-mono text-sm  bg-white rounded p-2 shadow-sm mb-2">
                {userAnswer.length > 0 ? userAnswer.join(' → ') : '（履歴）'}
              </div>

              {showAnswer && (
                <div className="text-sm  bg-yellow-50 border border-yellow-200 rounded p-2">
                  <strong>正解:</strong> {currentQuiz.join(' → ')}
                </div>
              )}
            </div>
          )}
          
          </div>
        </div>

        {/* 統合されたピアノキーボード */}
        <div className="flex-1">
          <ExtendedPianoKeyboard
            activeKeys={activeKeys}
            userAnswer={userAnswer}
            disabledKeys={getDisabledKeys()}
            isPlayingQuiz={isPlayingQuiz}
            onKeyPress={handleKeyPress}
            activeHand={activeHand}
          />
        </div>
        {/* 正解・不正解メッセージバー */}
        <div className="w-full text-center py-2 bg-white shadow-inner border-t text-sm sm:text-base font-semibold">
          {quizResult === 'correct' && <span className="text-green-600">🎉 正解！</span>}
          {quizResult === 'incorrect' && <span className="text-red-600">❌ 不正解</span>}
        </div>

      </div>
    </div>
  );
};

export default PianoQuizGame;