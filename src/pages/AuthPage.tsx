import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAuthInstance, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously
} from '../config/firebase';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const auth = getAuthInstance();
      // We map the username to a dummy email behind the scenes for Firebase Auth
      const dummyEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@chess.local`;
      
      if (isLogin) {
        await signInWithEmailAndPassword(auth, dummyEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, dummyEmail, password);
      }
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid username or password');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Username already taken. Please choose another one.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const auth = getAuthInstance();
      await signInAnonymously(auth);
      navigate('/');
    } catch (err: any) {
      // If Firebase fails completely (e.g. missing API keys), just bypass Auth
      import('../stores/useAuthStore').then(({ useAuthStore }) => {
        useAuthStore.getState().mockGuestLogin();
        navigate('/');
      });
    }
  };

  return (
    <div className="auth-page" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh' 
    }}>
      <div className="auth-card" style={{
        background: 'var(--bg-secondary)',
        padding: '2rem',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ padding: '0.75rem', marginTop: '1rem' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setIsLogin(!isLogin)}
            type="button"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
          
          <div style={{ margin: '0.5rem 0', opacity: 0.5 }}>— OR —</div>

          <button 
            className="btn btn-ghost btn-sm"
            onClick={handleGuestLogin}
            disabled={loading}
            type="button"
            style={{ border: '1px solid var(--border-color)' }}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
