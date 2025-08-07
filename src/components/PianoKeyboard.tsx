import React, { useEffect, useState } from 'react';

interface PianoKey {
  note: string;
  type: 'white' | 'black';
  key: string;
  solfege: string;
  hand: 'left' | 'right' | 'both';
}

interface PianoKeyboardProps {
  activeKeys: Set<string>;
  userAnswer: string[];
  disabledKeys: string[];
  isPlayingQuiz: boolean;
  onKeyPress: (note: string, event: React.MouseEvent | React.TouchEvent) => void;
  activeHand?: 'left' | 'right';
}

// 統合されたピアノキーレイアウト（重複なしのキーマッピング対応）
const ExtendedPianoKeys: PianoKey[] = [
  // 左手域（低音）
  { note: 'C2', type: 'white', key: 'z', solfege: 'ド', hand: 'left' },
  { note: 'C#2', type: 'black', key: '1', solfege: 'ド#', hand: 'left' },
  { note: 'D2', type: 'white', key: 'x', solfege: 'レ', hand: 'left' },
  { note: 'D#2', type: 'black', key: '2', solfege: 'レ#', hand: 'left' },
  { note: 'E2', type: 'white', key: 'c', solfege: 'ミ', hand: 'left' },
  { note: 'F2', type: 'white', key: 'v', solfege: 'ファ', hand: 'left' },
  { note: 'F#2', type: 'black', key: '3', solfege: 'ファ#', hand: 'left' },
  { note: 'G2', type: 'white', key: 'b', solfege: 'ソ', hand: 'left' },
  { note: 'G#2', type: 'black', key: '4', solfege: 'ソ#', hand: 'left' },
  { note: 'A2', type: 'white', key: 'n', solfege: 'ラ', hand: 'left' },
  { note: 'A#2', type: 'black', key: '5', solfege: 'ラ#', hand: 'left' },
  { note: 'B2', type: 'white', key: 'm', solfege: 'シ', hand: 'left' },
  
  { note: 'C3', type: 'white', key: 'q', solfege: 'ド', hand: 'left' },
  { note: 'C#3', type: 'black', key: '6', solfege: 'ド#', hand: 'left' },
  { note: 'D3', type: 'white', key: 'w', solfege: 'レ', hand: 'left' },
  { note: 'D#3', type: 'black', key: '7', solfege: 'レ#', hand: 'left' },
  { note: 'E3', type: 'white', key: 'e', solfege: 'ミ', hand: 'left' },
  { note: 'F3', type: 'white', key: 'r', solfege: 'ファ', hand: 'left' },
  { note: 'F#3', type: 'black', key: '8', solfege: 'ファ#', hand: 'left' },
  { note: 'G3', type: 'white', key: 't', solfege: 'ソ', hand: 'left' },
  { note: 'G#3', type: 'black', key: '9', solfege: 'ソ#', hand: 'left' },
  { note: 'A3', type: 'white', key: 'y', solfege: 'ラ', hand: 'left' },
  { note: 'A#3', type: 'black', key: '0', solfege: 'ラ#', hand: 'left' },
  { note: 'B3', type: 'white', key: 'u', solfege: 'シ', hand: 'left' },

  // 境界域（両手で使用可能）
  { note: 'C4', type: 'white', key: 'a', solfege: 'ド', hand: 'both' },
  { note: 'C#4', type: 'black', key: '-', solfege: 'ド#', hand: 'both' },
  { note: 'D4', type: 'white', key: 's', solfege: 'レ', hand: 'both' },
  { note: 'D#4', type: 'black', key: '=', solfege: 'レ#', hand: 'both' },
  { note: 'E4', type: 'white', key: 'd', solfege: 'ミ', hand: 'both' },

  // 右手域（高音）
  { note: 'F4', type: 'white', key: 'f', solfege: 'ファ', hand: 'right' },
  { note: 'F#4', type: 'black', key: '[', solfege: 'ファ#', hand: 'right' },
  { note: 'G4', type: 'white', key: 'g', solfege: 'ソ', hand: 'right' },
  { note: 'G#4', type: 'black', key: ']', solfege: 'ソ#', hand: 'right' },
  { note: 'A4', type: 'white', key: 'h', solfege: 'ラ', hand: 'right' },
  { note: 'A#4', type: 'black', key: '\\', solfege: 'ラ#', hand: 'right' },
  { note: 'B4', type: 'white', key: 'j', solfege: 'シ', hand: 'right' },
  
  { note: 'C5', type: 'white', key: 'k', solfege: 'ド', hand: 'right' },
  { note: 'C#5', type: 'black', key: ',', solfege: 'ド#', hand: 'right' },
  { note: 'D5', type: 'white', key: 'l', solfege: 'レ', hand: 'right' },
  { note: 'D#5', type: 'black', key: '.', solfege: 'レ#', hand: 'right' },
  { note: 'E5', type: 'white', key: ';', solfege: 'ミ', hand: 'right' },
  { note: 'F5', type: 'white', key: "'", solfege: 'ファ', hand: 'right' }
];

const ExtendedPianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeKeys,
  userAnswer,
  disabledKeys,
  isPlayingQuiz,
  onKeyPress,
  activeHand = 'right'
}) => {
  const [whiteKeyWidth, setWhiteKeyWidth] = useState(48);

useEffect(() => {
  const updateWidth = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    // 画面サイズと向きに応じてキーの幅を変更
    if (width >= 1920) {
      setWhiteKeyWidth(isLandscape ? 64 : 56); // デスクトップ・4Kなど
    } else if (width >= 1440) {
      setWhiteKeyWidth(isLandscape ? 56 : 48); // フルHD以上
    } else if (width >= 1024) {
      setWhiteKeyWidth(isLandscape ? 48 : 40); // タブレット・ノートPC
    } else if (width >= 768) {
      setWhiteKeyWidth(isLandscape ? 40 : 36); // タブレット
    } else {
      setWhiteKeyWidth(isLandscape ? 36 : 28); // スマホ（横画面優先）
    }
  };

  updateWidth();
  window.addEventListener('resize', updateWidth);
  return () => window.removeEventListener('resize', updateWidth);
}, []);


  const getKeyColor = (key: PianoKey) => {
    const isActive = Array.from(activeKeys).some(activeKey => activeKey.startsWith(key.note));
    const isInAnswer = userAnswer.includes(key.note);
    const isDisabled = disabledKeys.includes(key.note);
    
    // アクティブハンドに応じて操作可能かどうかを判定
    const isPlayable = key.hand === activeHand || key.hand === 'both';

    if (key.type === 'white') {
      if (isDisabled || (!isPlayable && !isActive && !isInAnswer)) {
        return 'bg-gray-100 text-gray-300 border-gray-200';
      }
      if (isActive) {
        return 'bg-blue-200 border-blue-400';
      }
      if (isInAnswer) return 'bg-yellow-100 border-yellow-400';
      
      return 'bg-white border-gray-300';
    } else {
      if (isDisabled || (!isPlayable && !isActive && !isInAnswer)) {
        return 'bg-gray-400 text-gray-300 border-gray-500';
      }
      if (isActive) {
        return 'bg-blue-600 border-blue-500';
      }
      if (isInAnswer) return 'bg-yellow-600 border-yellow-500';
      
      return 'bg-black text-white border-gray-600';
    }
  };

  const isKeyDisabled = (key: PianoKey) => {
    const isPlayable = key.hand === activeHand || key.hand === 'both';
    return disabledKeys.includes(key.note) || isPlayingQuiz || !isPlayable;
  };

  // 白鍵のリストを取得
  const whiteKeys = ExtendedPianoKeys.filter(key => key.type === 'white');
  
  // 黒鍵の位置を計算する関数
  const getBlackKeyPosition = (blackKey: PianoKey): number | null => {
    const noteName = blackKey.note.slice(0, -1);
    const octave = blackKey.note.slice(-1);
    
    // 黒鍵の位置パターン（オクターブ内での相対位置）
    const blackKeyPositions: Record<string, number> = {
      'C#': 0.75,  // C と D の間
      'D#': 1.75,  // D と E の間
      'F#': 3.75,  // F と G の間
      'G#': 4.75,  // G と A の間
      'A#': 5.75,  // A と B の間
    };
    
    if (!blackKeyPositions[noteName]) return null;
    
    // そのオクターブの C の位置を見つける
    const cNote = `C${octave}`;
    const cIndex = whiteKeys.findIndex(k => k.note === cNote);
    
    if (cIndex === -1) return null;
    
    // 黒鍵の位置を計算
    const position = cIndex + blackKeyPositions[noteName];
    return position * whiteKeyWidth;
  };

  // キーボードの総幅を計算
  const totalWidth = whiteKeys.length * whiteKeyWidth + 64; // パディング分を追加

  return (
    <div className="flex-1 flex justify-center items-end">
      <div className="relative bg-gray-200 p-4 rounded-xl shadow-lg w-full max-w-7xl">
        {/* 手の表示 */}
        <div className="text-center mb-4">
          <div className={`text-lg font-bold mb-2 ${
            activeHand === 'left' ? 'text-gray-700' : 'text-gray-700'
          }`}>
            {activeHand === 'left' ? '🤚 左手モード (Left Hand)' : '✋ 右手モード (Right Hand)'}
          </div>
        </div>
        
        {/* スクロール可能なキーボードコンテナ */}
        <div 
          className="relative overflow-x-auto pb-2"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#94a3b8 #e2e8f0'
          }}
        >
          <div 
            className="relative flex justify-start px-8"
            style={{ width: `${totalWidth}px`, minWidth: '100%' }}
          >
            {/* White keys */}
            <div className="flex">
              {whiteKeys.map((key, index) => {
                const isActive = Array.from(activeKeys).some(activeKey => activeKey.startsWith(key.note));
                const isDisabled = isKeyDisabled(key);
                const keyColor = getKeyColor(key);

                return (
                  <button
                    key={key.note}
                    onTouchStart={(e) => {
                      if (!isDisabled) onKeyPress(key.note, e);
                    }}
                    onMouseDown={(e) => {
                      if (!isDisabled) onKeyPress(key.note, e);
                    }}
                    disabled={isDisabled}
                    style={{ width: `${whiteKeyWidth}px` }}
                    className={`
                      h-40 md:h-48 lg:h-56 xl:h-64 border rounded-b-xl
                      transition-all duration-200 flex flex-col justify-end items-center pb-2 md:pb-3
                      ${keyColor}
                      ${isActive ? 'animate-pulse shadow-lg' : 'shadow-md'}
                      ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:opacity-80 cursor-pointer hover:shadow-lg'}
                      touch-manipulation flex-shrink-0
                    `}
                  >
                    <span className={`text-xs ${isDisabled ? 'text-gray-300' : 'text-gray-600'}`}>
                      {key.solfege}
                    </span>
                    <span className={`text-xs ${isDisabled ? 'text-gray-300' : 'text-gray-700'}`}>
                      {key.note}
                    </span>
                    <span className="text-[6px] bg-white bg-opacity-70 px-1 rounded mb-1 text-gray-500 border">
                      {key.key?.toUpperCase()}
                    </span>                  
                  </button>
                );
              })}
            </div>

            {/* Black keys */}
            <div className="absolute top-0" style={{ left: '32px' }}>
              {ExtendedPianoKeys.filter(k => k.type === 'black').map((key) => {
                const leftPosition = getBlackKeyPosition(key);
                
                if (leftPosition === null) return null;

                const isActive = activeKeys.has(key.note);
                const isDisabled = isKeyDisabled(key);
                const keyColor = getKeyColor(key);
                const blackKeyWidth = whiteKeyWidth * 0.6;

                return (
                  <button
                    key={key.note}
                    onTouchStart={(e) => {
                      if (!isDisabled) onKeyPress(key.note, e);
                    }}
                    onMouseDown={(e) => {
                      if (!isDisabled) onKeyPress(key.note, e);
                    }}
                    disabled={isDisabled}
                    style={{
                      left: `${leftPosition - blackKeyWidth / 2}px`,
                      width: `${blackKeyWidth * 1.4 }px`,
                    }}
                    className={`
                      absolute h-24 md:h-32 lg:h-36 xl:h-40 
                      border-2 rounded-b-lg shadow-xl z-10
                      transition-all duration-200 flex flex-col justify-end items-center pb-1 md:pb-2
                      ${keyColor}
                      ${isActive ? 'animate-pulse shadow-2xl' : ''}
                      ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:opacity-80 cursor-pointer hover:shadow-2xl'}
                      touch-manipulation
                    `}
                  >
                    <span className={`text-xs ${isDisabled ? 'text-gray-400' : key.type === 'black' ? 'text-white' : 'text-gray-600'}`}>
                      {key.solfege}
                    </span>
                    <span className="text-[6px] bg-black bg-opacity-50 px-1 rounded mb-1 border text-gray-200">
                      {key.key?.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* スクロールヒント */}
      <div className="text-center mt-2 text-xs text-gray-500">
        ← 左右にスクロールしてすべての鍵盤を表示 →
      </div>

      </div>
      
      {/* カスタムスクロールバースタイル */}
    <style jsx>{`
      .overflow-x-auto::-webkit-scrollbar {
        height: 8px;
      }
      .overflow-x-auto::-webkit-scrollbar-track {
        background: #e2e8f0;
        border-radius: 4px;
      }
      .overflow-x-auto::-webkit-scrollbar-thumb {
        background: #94a3b8;
        border-radius: 4px;
      }
      .overflow-x-auto::-webkit-scrollbar-thumb:hover {
        background: #64748b;
      }
    `}</style>

    </div>
  );
};

export default ExtendedPianoKeyboard;
export { ExtendedPianoKeys };
export type { PianoKey, PianoKeyboardProps };

// 後方互換性のために既存のPianoKeysもエクスポート
export const PianoKeys: PianoKey[] = ExtendedPianoKeys.filter(key => 
  key.hand === 'right' || key.hand === 'both'
).slice(0, 18); // 元のPianoKeysと同じ数に制限