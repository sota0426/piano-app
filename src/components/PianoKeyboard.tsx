// src\components\PianoKeyboard.tsx
import React, { useEffect, useState } from 'react';

interface PianoKey {
  note: string;
  type: 'white' | 'black';
  key: string;
  solfege: string;
}

interface PianoKeyboardProps {
  activeKeys: Set<string>;
  userAnswer: string[];
  disabledKeys: string[];
  isPlayingQuiz: boolean;
  onKeyPress: (note: string, event: React.MouseEvent | React.TouchEvent) => void;
  keyboardLayout?: PianoKey[];
}

export const PianoKeys: PianoKey[] = [
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

const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeKeys,
  userAnswer,
  disabledKeys,
  isPlayingQuiz,
  onKeyPress,
  keyboardLayout = PianoKeys
}) => {
  const [whiteKeyWidth, setWhiteKeyWidth] = useState(48); // base:w-12

  useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth;
      if (width >= 1280) setWhiteKeyWidth(96); // xl:w-24
      else if (width >= 1024) setWhiteKeyWidth(80); // lg:w-20
      else if (width >= 768) setWhiteKeyWidth(64); // md:w-16
      else setWhiteKeyWidth(48); // base:w-12
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const getKeyColor = (key: PianoKey) => {
    const isActive = Array.from(activeKeys).some(activeKey => activeKey.startsWith(key.note));
    const isInAnswer = userAnswer.includes(key.note);
    const isDisabled = disabledKeys.includes(key.note);

    if (key.type === 'white') {
      if (isDisabled) return 'bg-gray-100 text-gray-300 border-gray-200';
      if (isActive) return 'bg-blue-200 border-blue-400';
      if (isInAnswer) return 'bg-yellow-100 border-yellow-400';
      return 'bg-white';
    } else {
      if (isDisabled) return 'bg-gray-400 text-gray-300 border-gray-500';
      if (isActive) return 'bg-blue-600 border-blue-500';
      if (isInAnswer) return 'bg-yellow-600 border-yellow-500';
      return 'bg-black';
    }
  };

  const isKeyDisabled = (key: PianoKey) => {
    return disabledKeys.includes(key.note) || isPlayingQuiz;
  };

  return (
    <div className="flex-1 flex justify-center items-end">
      <div className="relative bg-gray-200 p-2 rounded-xl shadow-lg overflow-x-auto">
        <div className="relative flex justify-center min-w-[500px] max-w-[90vw] md:min-w-[600px] lg:min-w-[700px] xl:min-w-[800px]">
          {/* White keys */}
          <div className="flex">
            {keyboardLayout.filter(key => key.type === 'white').map((key) => {
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
                  className={`
                    w-12 h-48 md:w-16 md:h-64 lg:w-20 lg:h-72 xl:w-24 xl:h-80 border border-gray-300 rounded-b-xl
                    transition-all duration-300 flex flex-col justify-end items-center pb-2 md:pb-3 lg:pb-4
                    ${keyColor}
                    ${isActive ? 'animate-pulse' : ''}
                    ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer'}
                    touch-manipulation
                  `}
                >
                  <span className={`text-xs md:text-sm ${isDisabled ? 'text-gray-300' : 'text-gray-600'}`}>
                    {key.solfege}
                  </span>
                  <span className={`text-xs md:text-sm ${isDisabled ? 'text-gray-300' : 'text-gray-600'}`}>
                    {key.note}
                  </span>
                  <span className="text-xs bg-white bg-opacity-50 px-1 rounded mb-1 text-gray-300 border border-gray-300">
                    {key.key?.toUpperCase()}
                  </span>                  
                </button>
              );
            })}
          </div>

          {/* Black keys */}
          <div className="absolute top-0 left-0 flex">
            {keyboardLayout.filter(key => key.type === 'black').map((key) => {
              const whiteKeyIndex = keyboardLayout.filter(k => k.type === 'white' &&
                keyboardLayout.indexOf(k) < keyboardLayout.indexOf(key)).length;

              const leftOffset = whiteKeyIndex * whiteKeyWidth - whiteKeyWidth / 4;
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
                  style={{ left: `${leftOffset}px` }}
                  className={`
                    absolute h-28 md:h-40 lg:h-45 xl:h-50 w-8 md:w-12 lg:w-14 xl:w-16 border border-gray-800 rounded-b-lg shadow-2xl text-white
                    transition-all duration-300 flex flex-col justify-end items-center pb-2 md:pb-3 z-10
                    ${keyColor}
                    ${isActive ? 'animate-pulse' : ''}
                    ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-800 active:bg-gray-700 cursor-pointer'}
                    touch-manipulation
                  `}
                >
                  <span className={`text-xs md:text-sm ${isDisabled ? 'text-gray-300' : ''}`}>
                    {key.solfege}
                  </span>
                  <span className={`text-xs md:text-sm ${isDisabled ? 'text-gray-300' : ''}`}>
                    {key.note}
                  </span>
                  <span className={`text-xs  bg-black bg-opacity-50 px-1 rounded mb-1 border text-gray-300`}>
                    {key.key?.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoKeyboard;
export type { PianoKey, PianoKeyboardProps };
