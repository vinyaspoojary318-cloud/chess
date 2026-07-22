import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ReviewPage } from './pages/ReviewPage';
import { SummaryPage } from './pages/SummaryPage';
import { MyGamesPage } from './pages/MyGamesPage';
import { AuthPage } from './pages/AuthPage';
import { PlayPage } from './pages/PlayPage';
import { PlayComputerPage } from './pages/PlayComputerPage';
import { useAuthStore } from './stores/useAuthStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          <Route path="/review" element={
            <ProtectedRoute>
              <ReviewPage />
            </ProtectedRoute>
          } />
          
          <Route path="/summary" element={
            <ProtectedRoute>
              <SummaryPage />
            </ProtectedRoute>
          } />
          
          <Route path="/my-games" element={
            <ProtectedRoute>
              <MyGamesPage />
            </ProtectedRoute>
          } />

          <Route path="/play-computer" element={
            <ProtectedRoute>
              <PlayComputerPage />
            </ProtectedRoute>
          } />

          <Route path="/play/:gameId?" element={
            <ProtectedRoute>
              <PlayPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
