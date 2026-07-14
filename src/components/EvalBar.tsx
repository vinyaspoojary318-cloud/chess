import { useGameStore } from '../stores/useGameStore';

export function EvalBar() {
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex);
  const moveAnalyses = useGameStore((s) => s.moveAnalyses);
  const progress = useGameStore((s) => s.progress);

  // Get the evaluation for the current position
  // The evalAfter of the current move or evalBefore of the next move
  let evalScore: number | null = null;
  if (currentMoveIndex >= 0 && currentMoveIndex < moveAnalyses.length) {
    evalScore = moveAnalyses[currentMoveIndex].evalAfter;
  } else if (currentMoveIndex === -1 && moveAnalyses.length > 0) {
    evalScore = moveAnalyses[0].evalBefore;
  }

  // Convert eval to a percentage for the bar (0 = black advantage, 50 = equal, 100 = white advantage)
  const getBarPercent = (eval_: number | null): number => {
    if (eval_ === null) return 50;
    // Clamp eval between -5 and 5 (in pawns)
    const clamped = Math.max(-5, Math.min(5, eval_));
    // Map from [-5, 5] to [0, 100]
    return ((clamped + 5) / 10) * 100;
  };

  const whitePercent = evalScore !== null ? getBarPercent(evalScore) : 50;
  const blackPercent = 100 - whitePercent;

  // Get eval text
  const getEvalText = (eval_: number | null): string => {
    if (eval_ === null) return '—';
    if (eval_ > 0) return `+${eval_.toFixed(2)}`;
    return eval_.toFixed(2);
  };

  return (
    <div className="eval-bar-container">
      <div className="eval-bar">
        <div
          className="eval-bar-white"
          style={{ height: `${whitePercent}%` }}
        >
          {whitePercent > 15 && (
            <span className="eval-text eval-white">{getEvalText(evalScore)}</span>
          )}
        </div>
        <div
          className="eval-bar-black"
          style={{ height: `${blackPercent}%` }}
        >
          {blackPercent > 15 && (
            <span className="eval-text eval-black">{getEvalText(evalScore)}</span>
          )}
        </div>
      </div>
      {progress.status === 'analyzing' && (
        <div className="eval-bar-loading">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
