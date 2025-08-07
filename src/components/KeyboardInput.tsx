import { useEffect } from 'react';

type Hand = 'left' | 'right';

type Props = {
  onNoteInput: (note: string) => void;
  enabled: boolean;
  hand: Hand;
};

// 統合されたキーマッピング（ExtendedPianoKeysと対応、重複なし）
const extendedKeyMappings: Record<string, string> = {
  // 左手域（低音）- 主にキーボード左側と下段を使用
  'z': 'C2', 'x': 'D2', 'c': 'E2', 'v': 'F2', 'b': 'G2', 'n': 'A2', 'm': 'B2',
  'q': 'C3', 'w': 'D3', 'e': 'E3', 'r': 'F3', 't': 'G3', 'y': 'A3', 'u': 'B3',
  
  // 黒鍵（左手域）
  '1': 'C#2', '2': 'D#2', '3': 'F#2', '4': 'G#2', '5': 'A#2',
  '6': 'C#3', '7': 'D#3', '8': 'F#3', '9': 'G#3', '0': 'A#3',

  // 境界域（両手共通）- 中央のキー
  'a': 'C4', 's': 'D4', 'd': 'E4',
  
  // 境界域の黒鍵
  '-': 'C#4', '=': 'D#4',

  // 右手域（高音）- 主にキーボード右側を使用
  'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5', 'l': 'D5', ';': 'E5', "'": 'F5',
  
  // 黒鍵（右手域）
  '[': 'F#4', ']': 'G#4', '\\': 'A#4', ',': 'C#5', '.': 'D#5'
};

// 左手用キーマッピング（左手域+境界域）
const leftHandKeyMappings: Record<string, string> = Object.fromEntries(
  Object.entries(extendedKeyMappings).filter(([_, note]) => {
    const octave = parseInt(note.slice(-1));
    return octave <= 4; // C4以下
  })
);

// 右手用キーマッピング（境界域+右手域）
const rightHandKeyMappings: Record<string, string> = Object.fromEntries(
  Object.entries(extendedKeyMappings).filter(([_, note]) => {
    const octave = parseInt(note.slice(-1));
    return octave >= 4; // C4以上
  })
);

const KeyboardInput = ({ onNoteInput, enabled, hand }: Props) => {
  useEffect(() => {
    if (!enabled) return;

    // handに応じてキーマッピングを選択
    let keyMappings: Record<string, string>;
    switch (hand) {
      case 'left':
        keyMappings = leftHandKeyMappings;
        break;
      case 'right':
        keyMappings = rightHandKeyMappings;
        break;
      default:
        keyMappings = extendedKeyMappings;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 修飾キー（Ctrl、Alt、Metaなど）が押されている場合は無視
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
        return;
      }

      const key = e.key.toLowerCase();
      const note = keyMappings[key];
      
      if (note) {
        e.preventDefault();
        onNoteInput(note);
      }
    };

    // キーリピートを防ぐためのフラグ
    const pressedKeys = new Set<string>();

    const handleKeyDownWithRepeatPrevention = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // 既に押されているキーは無視
      if (pressedKeys.has(key)) {
        return;
      }
      
      pressedKeys.add(key);
      handleKeyDown(e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeys.delete(key);
    };

    window.addEventListener('keydown', handleKeyDownWithRepeatPrevention);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDownWithRepeatPrevention);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onNoteInput, enabled, hand]);

  return null;
};

export default KeyboardInput;

// キーマッピングをエクスポート（デバッグや表示用）
export { leftHandKeyMappings, rightHandKeyMappings, extendedKeyMappings };