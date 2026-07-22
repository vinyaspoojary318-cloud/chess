import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ReviewPage } from './pages/ReviewPage';
import { SummaryPage } from './pages/SummaryPage';
import { MyGamesPage } from './pages/MyGamesPage';
import { AuthPage } from './pages/AuthPage';
import { PlayPage } from './pages/PlayPage';
import { useAuthStore } from './stores/useAuthStore';
function ProtectedRoute({ children }) {
    const { user, loading } = useAuthStore();
    const location = useLocation();
    if (loading) {
        return _jsx("div", { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }, children: "Loading..." });
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
function App() {
    const initAuth = useAuthStore((s) => s.initAuth);
    useEffect(() => {
        initAuth();
    }, [initAuth]);
    return (_jsx(BrowserRouter, { children: _jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(AuthPage, {}) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(HomePage, {}) }) }), _jsx(Route, { path: "/review", element: _jsx(ProtectedRoute, { children: _jsx(ReviewPage, {}) }) }), _jsx(Route, { path: "/summary", element: _jsx(ProtectedRoute, { children: _jsx(SummaryPage, {}) }) }), _jsx(Route, { path: "/my-games", element: _jsx(ProtectedRoute, { children: _jsx(MyGamesPage, {}) }) }), _jsx(Route, { path: "/play/:gameId?", element: _jsx(ProtectedRoute, { children: _jsx(PlayPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }));
}
export default App;
