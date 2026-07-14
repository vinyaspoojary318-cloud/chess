import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { stockfishManager } from '../lib/stockfishManager';

interface ManualMoveEntryProps {
  onLoaded: () => void;
}

export function ManualMoveEntry({ onLoaded }: ManualMoveEntryProps) {
  const [moveInput, setMoveInput] = useState('');
  const [movesList, setMovesList] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [bestMoveArrow, setBestMoveArrow] = useState<[string, string, string][]>([]);
  const addManualMoves = useGameStore((s) => s.addManualMoves);

  useEffect(() => {
    let active = true;
    const evaluate = async () => {
      try {
        const result = await stockfishManager.evaluatePosition(fen, 14);
        if (active && result.bestMove && result.bestMove.length >= 4) {
          const from = result.bestMove.substring(0, 2);
          const to = result.bestMove.substring(2, 4);
          setBestMoveArrow([[from, to, '#81b64c']]);
        } else if (active) {
          setBestMoveArrow([]);
        }
      } catch {
        if (active) setBestMoveArrow([]);
      }
    };
    
    const timer = setTimeout(evaluate, 500);
    return () => {
      active = false;
      clearTimeout(timer);
      stockfishManager.cancelPendingEvals();
    };
  }, [fen]);

  const handleAddMove = () => {
    const san = moveInput.trim();
    if (!san) return;

    try {
      const testChess = new Chess();
      // Replay all existing moves
      for (const m of movesList) {
        testChess.move(m);
      }
      testChess.move(san);

      setMovesList([...movesList, san]);
      setFen(testChess.fen());
      setMoveInput('');
      setError('');
    } catch {
      setError(`Invalid move: "${san}". Please use standard algebraic notation (e.g., e4, Nf3, O-O).`);
    }
  };

  const handleRemoveLast = () => {
    const newMoves = movesList.slice(0, -1);
    setMovesList(newMoves);
    const testChess = new Chess();
    for (const m of newMoves) {
      testChess.move(m);
    }
    setFen(testChess.fen());
    setError('');
  };

  const handleClear = () => {
    setMovesList([]);
    setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setError('');
  };

  const handleAnalyze = async () => {
    if (movesList.length === 0) {
      setError('Add at least one move to analyze');
      return;
    }
    try {
      await addManualMoves(movesList);
      onLoaded();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddMove();
    }
  };

  const onPieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    try {
      const testChess = new Chess();
      for (const m of movesList) {
        testChess.move(m);
      }
      
      // Try to construct move object
      const move = testChess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1].toLowerCase() ?? 'q',
      });
      
      if (move) {
        setMovesList([...movesList, move.san]);
        setFen(testChess.fen());
        setError('');
        return true;
      }
    } catch {
      // invalid move
    }
    return false;
  };

  // Build display text for moves
  const moveDisplay: string[] = [];
  for (let i = 0; i < movesList.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    let text = `${moveNum}. ${movesList[i]}`;
    if (i + 1 < movesList.length) {
      text += ` ${movesList[i + 1]}`;
    }
    moveDisplay.push(text);
  }

  return (
    <div className="manual-move-entry" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
        <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          customArrows={bestMoveArrow as any}
          animationDuration={200}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
          customDarkSquareStyle={{ backgroundColor: '#769656' }}
          customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
        />
      </div>

      <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Manual Entry</h2>
          <p className="manual-instruction">
            Enter moves using standard algebraic notation or drag pieces on the board. The engine will evaluate the position and draw an arrow for the best move.
          </p>
        </div>

        <div className="manual-input-row" style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="move-input"
            placeholder="e.g., e4"
            value={moveInput}
            onChange={(e) => setMoveInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={movesList.length >= 500}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddMove} disabled={movesList.length >= 500}>
            Add
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleRemoveLast} disabled={movesList.length === 0}>
            Undo
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleClear} disabled={movesList.length === 0}>
            Clear
          </button>
        </div>

        {error && <div className="pgn-error" style={{ color: 'red' }}>{error}</div>}

        <div className="manual-moves-preview" style={{ 
          background: 'rgba(0, 0, 0, 0.05)', 
          padding: '1rem', 
          borderRadius: '4px',
          minHeight: '100px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {moveDisplay.length > 0 ? (
            <div className="moves-preview-text" style={{ lineHeight: '1.5' }}>
              {moveDisplay.join('  ')}
            </div>
          ) : (
            <div className="moves-preview-empty" style={{ opacity: 0.6 }}>No moves entered yet</div>
          )}
        </div>

        {movesList.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            style={{ width: '100%', padding: '0.75rem', marginTop: 'auto' }}
          >
            Analyze {movesList.length} Move{movesList.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  );
}
