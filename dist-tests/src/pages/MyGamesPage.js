import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const handleLoadGame = (game) => {
        loadGameIntoReview(game);
        navigate('/review');
    };
    const handleDelete = async (id) => {
        if (confirm('Delete this game analysis?')) {
            await deleteGame(id);
        }
    };
    const formatDate = (timestamp) => {
        if (!timestamp)
            return 'Unknown date';
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
    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 90)
            return '#81b64c';
        if (accuracy >= 75)
            return '#f7c948';
        if (accuracy >= 50)
            return '#f7a823';
        return '#e23636';
    };
    return (_jsxs("div", { className: "my-games-page", children: [_jsxs("div", { className: "my-games-header", children: [_jsx("h2", { children: "My Games" }), _jsx("button", { className: "btn btn-secondary btn-sm", onClick: loadSavedGames, disabled: gamesLoading, children: gamesLoading ? 'Loading...' : 'Refresh' })] }), gamesLoading && (_jsxs("div", { className: "games-loading", children: [_jsx("div", { className: "spinner-lg" }), _jsx("p", { children: "Loading your games..." })] })), !gamesLoading && savedGames.length === 0 && (_jsxs("div", { className: "games-empty", children: [_jsx("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }), _jsx("h3", { children: "No saved games" }), _jsx("p", { children: "Analyze a game and save it to see it here." }), _jsx("button", { className: "btn btn-primary", onClick: () => navigate('/'), children: "Analyze a Game" })] })), !gamesLoading && savedGames.length > 0 && (_jsx("div", { className: "games-grid", children: savedGames.map((game) => (_jsxs("div", { className: "game-card", children: [_jsxs("div", { className: "game-card-header", children: [_jsxs("span", { className: "game-players", children: [game.white || 'White', " vs ", game.black || 'Black'] }), _jsx("span", { className: "game-result", children: game.result || '*' })] }), _jsxs("div", { className: "game-card-meta", children: [_jsx("span", { className: "game-date", children: formatDate(game.playedAt) }), _jsxs("span", { className: "game-moves-count", children: [game.moves?.length || 0, " moves"] })] }), _jsxs("div", { className: "game-card-stats", children: [_jsxs("div", { className: "game-stat", children: [_jsx("span", { className: "stat-label", children: "Accuracy" }), _jsxs("span", { className: "stat-value", style: { color: getAccuracyColor(game.accuracy || 0) }, children: [game.accuracy || 0, "%"] })] }), _jsxs("div", { className: "game-stat", children: [_jsx("span", { className: "stat-label", children: "Blunders" }), _jsx("span", { className: "stat-value stat-blunder", children: game.blunders || 0 })] }), _jsxs("div", { className: "game-stat", children: [_jsx("span", { className: "stat-label", children: "Mistakes" }), _jsx("span", { className: "stat-value stat-mistake", children: game.mistakes || 0 })] })] }), _jsxs("div", { className: "game-card-actions", children: [_jsx("button", { className: "btn btn-primary btn-sm", onClick: () => handleLoadGame(game), children: "Review" }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => handleDelete(game.id), children: "Delete" })] })] }, game.id))) }))] }));
}
