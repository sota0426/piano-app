// src\components\scale_quiz\GameHeader.tsx
import React from 'react';

interface GameHeaderProps {
  title: string;
  onMenuClick: () => void;
  onInstructionsClick: () => void;
  icon?: string;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  onMenuClick,
  onInstructionsClick,
  icon = "🎹"
}) => {
  return (
    <div className="flex items-center justify-between p-2 bg-white/80 backdrop-blur-sm shadow-sm">
      <button
        onClick={onMenuClick}
        className="rounded-md bg-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-300"
        aria-label="メニューを開く"
      >
        <div className="flex flex-col gap-0.5">
          <div className="w-4 h-0.5 bg-gray-600"></div>
          <div className="w-4 h-0.5 bg-gray-600"></div>
          <div className="w-4 h-0.5 bg-gray-600"></div>
        </div>
      </button>
      
      <h1 className="text-xl font-bold text-indigo-800">
        {icon} {title}
      </h1>
      
      <button
        onClick={onInstructionsClick}
        className="rounded-md bg-indigo-100 px-3 py-2 text-indigo-700 hover:bg-indigo-200"
        aria-label="遊び方を見る"
      >
        遊び方
      </button>
    </div>
  );
};

export default GameHeader;