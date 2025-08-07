// src/components/scale_quiz/GameMenu.tsx
import React from 'react';

interface Score {
  correct: number;
  total: number;
}

interface GameSettings {
  minNotes: number;
  maxNotes: number;
  noteRange: string;
}

interface GameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  score: Score;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onGoHome: () => void;
  activeHand: 'left' | 'right';
  setActiveHand: (hand: 'left' | 'right') => void;
}

const defaultSettingsConfig = {
  noteRangeOptions: [
    { value: 'basic4', label: '基本4音：ド・レ・ミ・ファ（超簡単）' },
    { value: 'high4', label: '高音4音：ソ・ラ・シ・ド（超簡単）' },
    { value: 'diatonic8', label: 'ドレミファソラシド（簡単）' },
    { value: 'white12', label: '白鍵のみ（中級）' },
    { value: 'all18', label: '全ての音（上級）' }
  ],
  minNotesOptions: [1, 2, 3],
  maxNotesOptions: [1, 2, 3, 4, 5]
};

const GameMenu: React.FC<GameMenuProps> = ({
  isOpen,
  onClose,
  score,
  settings,
  onSettingsChange,
  onGoHome,
  activeHand,
  setActiveHand
}) => {
  if (!isOpen) return null;

  const handleMinNotesChange = (minNotes: number) => {
    onSettingsChange({
      ...settings,
      minNotes,
      maxNotes: Math.max(settings.maxNotes, minNotes)
    });
  };

  const handleMaxNotesChange = (maxNotes: number) => {
    onSettingsChange({
      ...settings,
      maxNotes,
      minNotes: Math.min(settings.minNotes, maxNotes)
    });
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-start justify-start z-50">
      <div className="bg-white rounded-r-lg p-6 h-full min-w-80 shadow-xl overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">メニュー</h3>
        </div>

        <div className="space-y-6">
          {/* スコア */}
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

          {/* 手の切り替え */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">手の切り替え</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveHand('left')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeHand === 'left'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                🤚 左手
              </button>
              <button
                onClick={() => setActiveHand('right')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeHand === 'right'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                ✋ 右手
              </button>
            </div>
          </div>

          {/* 設定 */}
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
                      onChange={(e) => handleMinNotesChange(parseInt(e.target.value))}
                      className="ml-1 px-2 py-1 border rounded text-sm"
                    >
                      {defaultSettingsConfig.minNotesOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}音
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">最大</label>
                    <select
                      value={settings.maxNotes}
                      onChange={(e) => handleMaxNotesChange(parseInt(e.target.value))}
                      className="ml-1 px-2 py-1 border rounded text-sm"
                    >
                      {defaultSettingsConfig.maxNotesOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}音
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">音の範囲</label>
                <select
                  value={settings.noteRange}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, noteRange: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  {defaultSettingsConfig.noteRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
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
    </div>
  );
};

export default GameMenu;
export type { Score, GameSettings, GameMenuProps };
