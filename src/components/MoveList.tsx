import { useRef, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import type { MoveClassification } from '../types';

const classificationColors: Record<MoveClassification, string> = {
  brilliant: '#7b61ff',
  best: '#81b64c',
  good: '#81b64c',
  inaccuracy: '#f7c948',
  mistake: '#f7a823',
  blunder: '#e23636',
};



export function MoveList() {
  const moves = useGameStore((s) => s.moves);
  const moveAnalyses = useGameStore((s) => s.moveAnalyses);
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex);
  const goToMove = useGameStore((s) => s.goToMove);
  const progress = useGameStore((s) => s.progress);

  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current move
  useEffect(() => {
    if (listRef.current) {
      const activeItem = listRef.current.querySelector('.move-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentMoveIndex]);

  // Group moves into pairs (white/black)
  const movePairs: { num: number; white?: string; black?: string; whiteIndex?: number; blackIndex?: number }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    const pair: any = { num: Math.floor(i / 2) + 1, white: moves[i], whiteIndex: i };
    if (i + 1 < moves.length) {
      pair.black = moves[i + 1];
      pair.blackIndex = i + 1;
    }
    movePairs.push(pair);
  }



  const getClassificationDot = (index: number) => {
    const analysis = moveAnalyses[index];
    if (!analysis || analysis.classification === 'best') return null;
    return (
      <span
        className="classification-dot"
        style={{
          backgroundColor: classificationColors[analysis.classification],
          width: index === currentMoveIndex ? 10 : 6,
          height: index === currentMoveIndex ? 10 : 6,
        }}
        title={`${analysis.classification} (${Math.abs(analysis.swing || 0).toFixed(2)})`}
      />
    );
  };

  return (
    <div className="move-list-container">
      <div className="move-list-header">
        <h3>Moves</h3>
        {progress.status === 'analyzing' && (
          <span className="analyzing-badge">
            Analyzing... {progress.current}/{progress.total}
          </span>
        )}
        {progress.status === 'done' && moveAnalyses.length > 0 && (
          <span className="analyzed-badge">Analyzed</span>
        )}
      </div>
      <div className="move-list" ref={listRef}>
        {movePairs.length === 0 && (
          <div className="move-list-empty">No moves yet. Load a game to begin.</div>
        )}
        {movePairs.map((pair) => (
          <div key={pair.num} className="move-pair">
            <span className="move-number">{pair.num}.</span>
            <button
              className={`move-item ${currentMoveIndex === pair.whiteIndex ? 'active' : ''} ${
                moveAnalyses[pair.whiteIndex!]?.classification || ''
              }`}
              onClick={() => goToMove(pair.whiteIndex!)}
            >
              {pair.white}
              {moveAnalyses[pair.whiteIndex!] && (
                <span className="move-swing">
                  {getClassificationDot(pair.whiteIndex!)}
                </span>
              )}
            </button>
            {pair.black !== undefined && (
              <button
                className={`move-item ${currentMoveIndex === pair.blackIndex ? 'active' : ''} ${
                  moveAnalyses[pair.blackIndex!]?.classification || ''
                }`}
                onClick={() => goToMove(pair.blackIndex!)}
              >
                {pair.black}
                {moveAnalyses[pair.blackIndex!] && (
                  <span className="move-swing">
                    {getClassificationDot(pair.blackIndex!)}
                  </span>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
