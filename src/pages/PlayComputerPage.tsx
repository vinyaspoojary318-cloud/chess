import { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import { stockfishManager } from '../lib/stockfishManager';
import { useGameStore } from '../stores/useGameStore';
import { playMoveByType } from '../lib/soundEffects';

export function PlayComputerPage() {
  const navigate = useNavigate();
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [moves, setMoves] = useState<string[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState('');
  const [difficulty, setDifficulty] = useState(10); // 1 to 20 for stockfish depth
  const addManualMoves = useGameStore((s) => s.addManualMoves);

  // Initialize stockfish when entering the page
  useEffect(() => {
    stockfishManager.init().catch(console.error);
    return () => {
      stockfishManager.cancelPendingEvals();
    };
  }, []);

  const checkGameOver = useCallback(() => {
    if (chess.isCheckmate()) {
      setGameOver(`Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins.`);
      return true;
    }
    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      setGameOver('Game over: Draw');
      return true;
    }
    return false;
  }, [chess]);

  const makeComputerMove = useCallback(async () => {
    if (checkGameOver()) return;
    setIsPlayerTurn(false);

    try {
      const result = await stockfishManager.evaluatePosition(chess.fen(), difficulty);
      if (result.bestMove) {
        const move = chess.move({
          from: result.bestMove.substring(0, 2),
          to: result.bestMove.substring(2, 4),
          promotion: result.bestMove[4] || 'q',
        });
        if (move) {
          playMoveByType(move.san, chess.isCheckmate(), chess.isDraw());
          setFen(chess.fen());
          setMoves((prev) => [...prev, move.san]);
          setIsPlayerTurn(true);
          checkGameOver();
        }
      }
    } catch (err) {
      console.error('Computer move failed:', err);
      setIsPlayerTurn(true);
    }
  }, [chess, difficulty, checkGameOver]);

  const onPieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (!isPlayerTurn || gameOver) return false;

    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1]?.toLowerCase() ?? 'q',
      });

      if (move) {
        playMoveByType(move.san, chess.isCheckmate(), chess.isDraw());
        setFen(chess.fen());
        setMoves((prev) => [...prev, move.san]);
        if (!checkGameOver()) {
          setTimeout(makeComputerMove, 300);
        }
        return true;
      }
    } catch {
      // Invalid move
    }
    return false;
  };

  const handleAnalyze = async () => {
    if (moves.length === 0) return;
    try {
      await addManualMoves(moves);
      navigate('/review');
    } catch (err) {
      console.error(err);
    }
  };

  const AnyChessboard = Chessboard as any;

  return (
    <div className="play-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Play Computer</h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label>
            Difficulty (Depth):
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(Number(e.target.value))}
              style={{ marginLeft: '0.5rem', padding: '0.25rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              disabled={moves.length > 0}
            >
              {[...Array(20)].map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
          </label>
        </div>

        {gameOver && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 'bold', color: '#4ade80' }}>{gameOver}</span>
            <button className="btn btn-primary btn-sm" onClick={handleAnalyze}>
              Analyze Game
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: '1', maxWidth: '600px' }}>
          <AnyChessboard
            position={fen}
            onPieceDrop={onPieceDrop}
            boardOrientation={'white'}
            animationDuration={200}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#769656' }}
            customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
          />
        </div>
        <div style={{ width: '200px', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '4px', maxHeight: '600px', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>Moves</h3>
          {moves.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No moves yet</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {moves.map((m, i) => (
                <div key={i} style={{ display: 'flex' }}>
                  {i % 2 === 0 && <span style={{ marginRight: '0.5rem', opacity: 0.5 }}>{Math.floor(i / 2) + 1}.</span>}
                  <span>{m}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
