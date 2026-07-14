import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/useGameStore';

export function MyGamesPage() {
  const navigate = useNavigate();
  const savedGames = useGameStore((s) => s.savedGames);
  const gamesLoading = useGameStore((s) => s.gamesLoading);
  const loadSavedGames = useGameStore((s) => s.loadSavedGames);
  const loadGameIntoReview = useGameStore((s) => s.loadGameIntoReview);
  const deleteGame = useGameStore((s) => s.deleteGame);

  useEffect(() => {
    loadSavedGames();
  }, [loadSavedGames]);

  const handleLoadGame = (game: any) => {
    loadGameIntoReview(game);
    navigate('/review');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this game analysis?')) {
      await deleteGame(id);
    }
  };

  const formatDate = (timestamp: number | any) => {
    if (!timestamp) return 'Unknown date';
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    // Firebase timestamp
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return 'Unknown date';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#81b64c';
    if (accuracy >= 75) return '#f7c948';
    if (accuracy >= 50) return '#f7a823';
    return '#e23636';
  };

  return (
    <div className="my-games-page">
      <div className="my-games-header">
        <h2>My Games</h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={loadSavedGames}
          disabled={gamesLoading}
        >
          {gamesLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {gamesLoading && (
        <div className="games-loading">
          <div className="spinner-lg" />
          <p>Loading your games...</p>
        </div>
      )}

      {!gamesLoading && savedGames.length === 0 && (
        <div className="games-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <h3>No saved games</h3>
          <p>Analyze a game and save it to see it here.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Analyze a Game
          </button>
        </div>
      )}

      {!gamesLoading && savedGames.length > 0 && (
        <div className="games-grid">
          {savedGames.map((game) => (
            <div key={game.id} className="game-card">
              <div className="game-card-header">
                <span className="game-players">
                  {game.white || 'White'} vs {game.black || 'Black'}
                </span>
                <span className="game-result">{game.result || '*'}</span>
              </div>
              <div className="game-card-meta">
                <span className="game-date">{formatDate(game.playedAt)}</span>
                <span className="game-moves-count">{game.moves?.length || 0} moves</span>
              </div>
              <div className="game-card-stats">
                <div className="game-stat">
                  <span className="stat-label">Accuracy</span>
                  <span className="stat-value" style={{ color: getAccuracyColor(game.accuracy || 0) }}>
                    {game.accuracy || 0}%
                  </span>
                </div>
                <div className="game-stat">
                  <span className="stat-label">Blunders</span>
                  <span className="stat-value stat-blunder">{game.blunders || 0}</span>
                </div>
                <div className="game-stat">
                  <span className="stat-label">Mistakes</span>
                  <span className="stat-value stat-mistake">{game.mistakes || 0}</span>
                </div>
              </div>
              <div className="game-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleLoadGame(game)}
                >
                  Review
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDelete(game.id!)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
