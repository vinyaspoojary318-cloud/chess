import { Link, useLocation } from 'react-router-dom';
import { VolumeControl } from './VolumeControl';
import { SoundToggle } from './SoundToggle';
import { useAuthStore } from '../stores/useAuthStore';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="app-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <span className="app-name">Chess Review</span>
          </Link>
          <div className="header-right">
            <nav className="app-nav">
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/my-games"
                className={`nav-link ${isActive('/my-games') ? 'active' : ''}`}
              >
                My Games
              </Link>
            </nav>
            <div className="sound-controls">
              <SoundToggle />
              <VolumeControl />
              {useAuthStore((s) => s.user) && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => useAuthStore.getState().signOut()}
                  style={{ marginLeft: '1rem' }}
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
