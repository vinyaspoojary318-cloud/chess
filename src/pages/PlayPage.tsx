import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useLiveGameStore } from '../stores/useLiveGameStore';
import { useGameStore } from '../stores/useGameStore';
import { useAuthStore } from '../stores/useAuthStore';

export function PlayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { status, color, fen, moves, joinGame, makeMove, leaveGame, result } = useLiveGameStore();
  const addManualMoves = useGameStore((s) => s.addManualMoves);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }

    const init = async () => {
      const success = await joinGame(gameId);
      if (!success) {
        setError('Failed to join game. It may be full or not exist.');
      }
      setLoading(false);
    };

    init();

    return () => {
      leaveGame();
    };
  }, [gameId, joinGame, leaveGame, navigate]);

  const onPieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (status !== 'playing') return false;

    const chess = new Chess();
    // Load current fen by applying moves (to ensure correct turn and history)
    for (const m of moves) {
      try { chess.move(m); } catch {}
    }

    // Only allow move if it's our turn
    if (chess.turn() !== color) return false;

    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1].toLowerCase() ?? 'q',
      });

      if (move) {
        makeMove(move.san);
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading game...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>{error}</div>;

  const inviteLink = `${window.location.origin}/play/${gameId}`;
  const isOurTurn = () => {
    const chess = new Chess();
    for (const m of moves) {
      try { chess.move(m); } catch {}
    }
    return chess.turn() === color;
  };

  return (
    <div className="play-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Live Match</h2>
        {status === 'waiting' && (
          <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
            <span>Waiting for opponent... Share this link: </span>
            <input 
              readOnly 
              value={inviteLink} 
              style={{ width: '250px', padding: '0.25rem', marginLeft: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} 
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
        )}
        {status === 'playing' && (
          <div style={{ fontWeight: 'bold', color: isOurTurn() ? '#4ade80' : '#9ca3af' }}>
            {isOurTurn() ? "Your turn!" : "Opponent's turn"}
          </div>
        )}
        {status === 'finished' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>Game Over! Result: {result}</span>
            <button className="btn btn-primary btn-sm" onClick={handleAnalyze}>
              Analyze Game
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: '1', maxWidth: '600px' }}>
          <Chessboard
            position={fen}
            onPieceDrop={onPieceDrop}
            boardOrientation={color === 'b' ? 'black' : 'white'}
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
