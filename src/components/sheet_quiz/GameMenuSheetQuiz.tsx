import React from 'react';

interface GameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeHand: 'left' | 'right';
  setActiveHand: (hand: 'left' | 'right') => void;
  mode: 'all' | 'white' | 'black';
  setMode: (mode: 'all' | 'white' | 'black') => void;
  onGoHome: () => void;
}

const GameMenuSheetQuiz: React.FC<GameMenuProps> = ({
  isOpen,
  onClose,
  activeHand,
  setActiveHand,
  mode,
  setMode,
  onGoHome
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/50 flex items-start justify-center z-50">
      <div className="bg-white rounded-lg p-6 mt-10 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold mb-6">設定</h3>

        {/* 手のモード */}
        <div className="mb-6">
          <h4 className="text-md font-bold mb-2">手のモード</h4>
          <div className="flex gap-2">
            {(['left', 'right'] as const).map((hand) => (
              <button
                key={hand}
                onClick={() => setActiveHand(hand)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeHand === hand
                    ? 'bg-blue-500 text-white shadow'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {hand === 'left' ? '🤚 左手' : '✋ 右手'}
              </button>
            ))}
          </div>
        </div>

        {/* 鍵盤モード */}
        <div className="mb-6">
          <h4 className="text-md font-bold mb-2">鍵盤モード</h4>
          <div className="flex gap-2">
            {(['all', 'white', 'black'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                  mode === m
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {m === 'all' ? '全部' : m === 'white' ? '白鍵' : '黒鍵'}
              </button>
            ))}
          </div>
        </div>

       {/* 戻るボタン */}
          <div className="border-t pt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              ← ゲームに戻る
            </button>
            <button
              onClick={onGoHome}
              className="mt-2 w-full px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
            >
              ホームに戻る
            </button>
          </div>
      </div>
    </div>
  );
};

export default GameMenuSheetQuiz;
