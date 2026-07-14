import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/useGameStore';

export function SummaryPage() {
  const navigate = useNavigate();
  const gameData = useGameStore((s) => s.gameData);
  const moves = useGameStore((s) => s.moves);
  const loadGameIntoReview = useGameStore((s) => s.loadGameIntoReview);

  if (!gameData) {
    return (
      <div className="summary-page">
        <div className="summary-empty">
          <h2>No Analysis Data</h2>
          <p>Load and analyze a game first to see the summary.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const classificationData = [
    {
      label: 'Blunders',
      count: gameData.blunders,
      color: '#e23636',
      description: 'Eval swing > 2.0 pawns',
      icon: '??',
    },
    {
      label: 'Mistakes',
      count: gameData.mistakes,
      color: '#f7a823',
      description: 'Eval swing 1.0–2.0 pawns',
      icon: '?',
    },
    {
      label: 'Inaccuracies',
      count: gameData.inaccuracies,
      color: '#f7c948',
      description: 'Eval swing 0.5–1.0 pawns',
      icon: '?!',
    },
    {
      label: 'Good Moves',
      count: gameData.goodMoves,
      color: '#81b64c',
      description: 'Minor eval improvement',
      icon: '',
    },
    {
      label: 'Best Moves',
      count: gameData.bestMoves,
      color: '#7b61ff',
      description: 'Optimal engine move',
      icon: '!!',
    },
  ];


  const maxCount = Math.max(...classificationData.map((d) => d.count), 1);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#81b64c';
    if (accuracy >= 75) return '#f7c948';
    if (accuracy >= 50) return '#f7a823';
    return '#e23636';
  };

  const handleReviewGame = () => {
    if (gameData) {
      loadGameIntoReview(gameData);
      navigate('/review');
    }
  };

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h2>Game Summary</h2>
        <div className="game-meta">
          <span>{gameData.white || 'White'} vs {gameData.black || 'Black'}</span>
          <span className="game-result">{gameData.result}</span>
          <span>{moves.length} moves</span>
        </div>
      </div>

      <div className="accuracy-section">
        <div className="accuracy-circle" style={{ borderColor: getAccuracyColor(gameData.accuracy) }}>
          <span className="accuracy-value" style={{ color: getAccuracyColor(gameData.accuracy) }}>
            {gameData.accuracy}%
          </span>
          <span className="accuracy-label">Accuracy</span>
        </div>
      </div>

      <div className="classification-breakdown">
        <h3>Move Quality</h3>
        <div className="classification-bars">
          {classificationData.map((item) => (
            <div key={item.label} className="classification-row">
              <div className="classification-label">
                <span className="classification-name">
                  {item.icon && <span className="class-icon">{item.icon}</span>}
                  {item.label}
                </span>
                <span className="classification-count">{item.count}</span>
              </div>
              <div className="classification-bar-track">
                <div
                  className="classification-bar-fill"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <div className="classification-description">{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="summary-actions">
        <button className="btn btn-primary" onClick={handleReviewGame}>
          Review Moves
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          New Game
        </button>
      </div>
    </div>
  );
}
