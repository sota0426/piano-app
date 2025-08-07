// src\components\scale_quiz\ScoreDisplay.tsx
import React from 'react';

interface Score {
  correct: number;
  total: number;
}

interface ScoreDisplayProps {
  score: Score;
  variant?: 'simple' | 'detailed';
  className?: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  variant = 'simple',
  className = ''
}) => {
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className={` bg-gray-50 p-3 rounded ${className}`}>
      <div className="flex justify-center text-2xl font-bold text-gray-800 mb-1">
        {score.correct} / {score.total}
      </div>
      <div className="text-sm text-gray-600">
        正答率: {accuracy}%
      </div>
    </div>
  );
};

export default ScoreDisplay;