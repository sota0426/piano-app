"use client"

import KeyboardInput from '@/components/KeyboardInput';
import Modal from '@/components/Modal';
import useRealisticPianoAudio from '@/components/PianoAudio';
import ExtendedPianoKeyboard, { ExtendedPianoKeys } from "@/components/PianoKeyboard";
import GameMenuSheetQuiz from '@/components/sheet_quiz/GameMenuSheetQuiz';
import SheetMusic from '@/components/sheet_quiz/SheetMusic';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

type Hand = 'left' | 'right';

const Quiz: React.FC = () => {
  // 左右別の問題ノートと回答状態
  const [leftQuizNote, setLeftQuizNote] = useState('C3');
  const [rightQuizNote, setRightQuizNote] = useState('C4');

  const [leftUserAnswer, setLeftUserAnswer] = useState<string[]>([]);
  const [rightUserAnswer, setRightUserAnswer] = useState<string[]>([]);

  const [leftIsCorrect, setLeftIsCorrect] = useState<boolean | null>(null);
  const [rightIsCorrect, setRightIsCorrect] = useState<boolean | null>(null);

  const [leftDisabledKeys, setLeftDisabledKeys] = useState<string[]>([]);
  const [rightDisabledKeys, setRightDisabledKeys] = useState<string[]>([]);

  const [mode, setMode] = useState<'all' | 'white' | 'black'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダル開閉  
  
  // 今操作している手
  const [activeHand, setActiveHand] = useState<Hand>('right');

  const { playNote } = useRealisticPianoAudio();
  const router = useRouter();

  // 新しい問題を作る（手ごとに）
  const generateNewNote = (hand: Hand) => {
    // 手に応じて適切な音域のキーをフィルタリング
    let availableKeys = ExtendedPianoKeys.filter(key => {
      if (hand === 'left') {
        return key.hand === 'left' || key.hand === 'both';
      } else {
        return key.hand === 'right' || key.hand === 'both';
      }
    });

    // モードに応じてフィルタリング
    if (mode === "white") {
      availableKeys = availableKeys.filter(k => k.type === "white");
    } else if (mode === "black") {
      availableKeys = availableKeys.filter(k => k.type === "black");
    }

    const allNotes = availableKeys.map(k => k.note);
    const randomNote = allNotes[Math.floor(Math.random() * allNotes.length)];

    if (hand === 'left') {
      setLeftQuizNote(randomNote);
      setLeftUserAnswer([]);
      setLeftIsCorrect(null);
      setLeftDisabledKeys([]);
      playNote(randomNote, 1.2, 0.9);
    } else {
      setRightQuizNote(randomNote);
      setRightUserAnswer([]);
      setRightIsCorrect(null);
      setRightDisabledKeys([]);
      playNote(randomNote, 1.2, 0.9);
    }
  };

  // 左手の入力処理
  const handleLeftKeyPress = (note: string) => {
    if (leftIsCorrect === false) {
      setLeftUserAnswer([]);
      setLeftDisabledKeys([]);
      setLeftIsCorrect(null);
    }

    setLeftUserAnswer([note]);
    playNote(note, 1.2, 0.8);

    if (note === leftQuizNote) {
      setLeftIsCorrect(true);
    } else {
      setLeftIsCorrect(false);
      setLeftDisabledKeys((prev) => [...prev, note]);
    }
  };

  // 右手の入力処理
  const handleRightKeyPress = (note: string) => {
    if (rightIsCorrect === false) {
      setRightUserAnswer([]);
      setRightDisabledKeys([]);
      setRightIsCorrect(null);
    }

    setRightUserAnswer([note]);
    playNote(note, 1.2, 0.8);

    if (note === rightQuizNote) {
      setRightIsCorrect(true);
    } else {
      setRightIsCorrect(false);
      setRightDisabledKeys((prev) => [...prev, note]);
    }
  };

  // 正解時に新しい問題を作る
  useEffect(() => {
    if (leftIsCorrect === true) {
      const timer = setTimeout(() => {
        generateNewNote('left');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [leftIsCorrect, mode]);

  useEffect(() => {
    if (rightIsCorrect === true) {
      const timer = setTimeout(() => {
        generateNewNote('right');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [rightIsCorrect, mode]);

  // 初期ロード時に両手の問題を用意
  useEffect(() => {
    generateNewNote('left');
    generateNewNote('right');
  }, []);

  // モード変更時に新しい問題を生成
  useEffect(() => {
    generateNewNote('left');
    generateNewNote('right');
  }, [mode]);

  return (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-blue-100 p-4">

    {/* ヘッダーエリア */}
    <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h2 className="text-3xl font-bold text-gray-800 text-center sm:text-left">🎼 音あてクイズ</h2>

      <div className="flex gap-3 justify-center sm:justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow"
        >
          ⚙️ 設定
        </button>
        <button
          onClick={() => generateNewNote(activeHand)}
          className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow"
        >
          🎵 次の問題
        </button>
      </div>
    </div>

<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 w-full">

  {/* 楽譜エリア */}
  <div className="w-full sm:basis-2/3 bg-white rounded-xl shadow-lg p-4">
    <SheetMusic 
      note={activeHand === 'left' ? leftQuizNote : rightQuizNote} 
      hand={activeHand}
    />
  </div>

  {/* キーボードエリア */}
  <div className="w-full sm:basis-1/12">
    <KeyboardInput
      onNoteInput={activeHand === 'left' ? handleLeftKeyPress : handleRightKeyPress}
      enabled={true}
      hand={activeHand}
    />

    <ExtendedPianoKeyboard
      activeKeys={new Set(activeHand === 'left' ? leftUserAnswer : rightUserAnswer)}
      userAnswer={activeHand === 'left' ? leftUserAnswer : rightUserAnswer}
      disabledKeys={activeHand === 'left' ? leftDisabledKeys : rightDisabledKeys}
      isPlayingQuiz={false}
      onKeyPress={activeHand === 'left' ? handleLeftKeyPress : handleRightKeyPress}
      activeHand={activeHand}
    />
  </div>
</div>


    {/* 問題表示・判定エリア */}
      {(activeHand === 'left' ? leftIsCorrect : rightIsCorrect) !== null && (
        <div className={`text-xl font-bold px-6 py-3 rounded-lg ${
          (activeHand === 'left' ? leftIsCorrect : rightIsCorrect)
            ? 'text-green-600 bg-green-100'
            : 'text-red-600 bg-red-100'
        }`}>
          {(activeHand === 'left' ? leftIsCorrect : rightIsCorrect) ? '🎉 正解！' : '❌ ちがいます'}
        </div>
      )}

    {/* モーダル（設定） */}
    <GameMenuSheetQuiz
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      activeHand={activeHand}
      setActiveHand={setActiveHand}
      mode={mode}
      setMode={setMode}
      onGoHome={()=>router.push("/")}
    />


  </div>
);
}

export default Quiz;