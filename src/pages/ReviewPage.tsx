import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChessBoard } from '../components/ChessBoard';
import { MoveList } from '../components/MoveList';
import { EvalBar } from '../components/EvalBar';
import { useGameStore } from '../stores/useGameStore';

export function ReviewPage() {
  const navigate = useNavigate();
  const moves = useGameStore((s) => s.moves);
  const progress = useGameStore((s) => s.progress);
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex);
  const gameData = useGameStore((s) => s.gameData);
  const startAnalysis = useGameStore((s) => s.startAnalysis);

  const goToStart = useGameStore((s) => s.goToStart);
  const goToEnd = useGameStore((s) => s.goToEnd);
  const stepForward = useGameStore((s) => s.stepForward);
  const stepBackward = useGameStore((s) => s.stepBackward);
  const saveGame = useGameStore((s) => s.saveGame);

  // Start analysis when the review page loads and moves exist
  useEffect(() => {
    if (moves.length > 0 && progress.status === 'idle') {
      startAnalysis();
    }
  }, [moves.length, progress.status, startAnalysis]);

  // Navigate to summary when analysis is done
  useEffect(() => {
    if (progress.status === 'done' && gameData) {
      navigate('/summary', { replace: true });
    }
  }, [progress.status, gameData, navigate]);

  const handleSave = async () => {
    const id = await saveGame();
    if (id) {
      alert('Game saved successfully!');
    } else {
      alert('Failed to save game. Check console for details.');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'j':
          stepBackward();
          break;
        case 'ArrowRight':
        case 'k':
          stepForward();
          break;
        case 'Home':
          goToStart();
          break;
        case 'End':
          goToEnd();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepBackward, stepForward, goToStart, goToEnd]);

  if (moves.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="review-page">
      <div className="review-header">
        <div className="review-info">
          <h2>Game Review</h2>
          <span className="move-count">
            {moves.length} move{moves.length !== 1 ? 's' : ''}
            {progress.status === 'analyzing' && (
              <span className="analyzing-text"> — Analyzing... ({progress.current}/{progress.total})</span>
            )}
          </span>
        </div>
        <div className="review-actions">
          {gameData && progress.status === 'done' && (
            <button className="btn btn-secondary btn-sm" onClick={handleSave}>
              Save Game
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/summary', { state: { fromReview: true } })}>
            View Summary
          </button>
        </div>
      </div>

      <div className="review-layout">
        <div className="review-board-section">
          <div className="board-and-eval">
            <EvalBar />
            <ChessBoard />
          </div>

          <div className="board-controls">
            <button className="control-btn" onClick={goToStart} title="Go to start (Home)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
            <button className="control-btn" onClick={stepBackward} title="Step backward (←)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="move-indicator">
              {currentMoveIndex + 1} / {moves.length}
            </div>
            <button className="control-btn" onClick={stepForward} title="Step forward (→)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button className="control-btn" onClick={goToEnd} title="Go to end (End)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="review-sidebar">
          <MoveList />
        </div>
      </div>
    </div>
  );
}
