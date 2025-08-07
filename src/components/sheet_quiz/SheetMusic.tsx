import React from 'react';
import { Renderer, Stave, StaveNote, Formatter, Accidental } from 'vexflow';

interface SheetMusicProps {
  note: string;       
  hand?: 'left' | 'right';
}

const SheetMusic: React.FC<SheetMusicProps> = ({ note, hand }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!note || typeof note !== 'string') {
      console.warn('SheetMusic: note is invalid:', note);
      return;
    }
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(260, 140);  // ⬅️ 楽譜を見やすく大きく

    const context = renderer.getContext();
    context.setFont('Arial', 12).setBackgroundFillStyle('#f9f9f9');

    const determineClef = (note: string, hand?: 'left' | 'right') => {
      if (hand) {
        return hand === 'left' ? 'bass' : 'treble';
      }
      const octave = parseInt(note.slice(-1), 10);
      return octave <= 3 ? 'bass' : 'treble';
    };

    const clef = determineClef(note, hand);

    const stave = new Stave(10, 20, 240);

    stave.addClef(clef);
    stave.setContext(context).draw();

    const noteLetter = note[0].toLowerCase();
    const hasSharp = note.includes('#');
    const hasFlat = note.includes('b');
    const octave = note.slice(-1);

    let accidental = '';
    if (hasSharp) accidental = '#';
    if (hasFlat) accidental = 'b';

    const vexNote = `${noteLetter}${accidental}/${octave}`;

    try {
      const staveNote = new StaveNote({
        clef,
        keys: [vexNote],
        duration: 'q',
      });

      if (hasSharp) staveNote.addModifier(new Accidental('#'));
      if (hasFlat) staveNote.addModifier(new Accidental('b'));

      Formatter.FormatAndDraw(context, stave, [staveNote]);
    } catch (error) {
      console.error('VexFlow rendering error:', error);
      context.fillText(`♪ ${note}`, 100, 120);
      context.fillText(`(${clef} clef)`, 90, 140);
    }
  }, [note, hand]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-center items-center w-full" ref={containerRef} />
      <div className="text-base text-gray-700 mt-2 text-center">
        {!hand && (parseInt(note.slice(-1)) <= 3 ? '🤚 低音域' : '✋ 高音域')}
      </div>
    </div>
  );
};

export default SheetMusic;
