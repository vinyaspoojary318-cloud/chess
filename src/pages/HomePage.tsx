import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PgnUpload } from '../components/PgnUpload';
import { ManualMoveEntry } from '../components/ManualMoveEntry';
import { useLiveGameStore } from '../stores/useLiveGameStore';

export function HomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'pgn' | 'manual' | 'play'>('pgn');
  const [creatingGame, setCreatingGame] = useState(false);
  const { createGame } = useLiveGameStore();

  const handleLoaded = () => {
    navigate('/review');
  };

  const handlePlayFriend = async () => {
    setCreatingGame(true);
    const gameId = await createGame();
    if (gameId) {
      navigate(`/play/${gameId}`);
    } else {
      alert('Failed to create game. Ensure your Supabase tables are set up and you are logged in.');
      setCreatingGame(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>Chess Dashboard</h1>
        <p className="home-subtitle">
          Analyze your chess games with Stockfish, or challenge a friend to a live match.
        </p>
      </div>

      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'play' ? 'active' : ''}`}
          onClick={() => setMode('play')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Play a Friend
        </button>
        <button
          className={`mode-tab ${mode === 'pgn' ? 'active' : ''}`}
          onClick={() => setMode('pgn')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Import PGN
        </button>
        <button
          className={`mode-tab ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Manual Entry
        </button>
      </div>

      <div className="upload-card">
        {mode === 'play' ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Play Chess Online</h2>
            <p style={{ marginBottom: '2rem' }}>Create a new match and invite any member via a shareable link.</p>
            <button 
              className="btn btn-primary" 
              style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}
              onClick={handlePlayFriend}
              disabled={creatingGame}
            >
              {creatingGame ? 'Creating...' : 'Create Live Match'}
            </button>
          </div>
        ) : mode === 'pgn' ? (
          <PgnUpload onLoaded={handleLoaded} />
        ) : (
          <ManualMoveEntry onLoaded={handleLoaded} />
        )}
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <h3>Engine Analysis</h3>
          <p>Every move is evaluated by Stockfish 18 running entirely in your browser.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h3>Move Classification</h3>
          <p>Each move is classified as blunder, mistake, inaccuracy, good, or best.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>Save & Review</h3>
          <p>Save games to your account and revisit them anytime.</p>
        </div>
      </div>
    </div>
  );
}
