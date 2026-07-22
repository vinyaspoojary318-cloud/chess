import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PgnUpload } from '../components/PgnUpload';
import { ManualMoveEntry } from '../components/ManualMoveEntry';
import { useLiveGameStore } from '../stores/useLiveGameStore';
export function HomePage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('pgn');
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
        }
        else {
            alert('Failed to create game. Ensure your Supabase tables are set up and you are logged in.');
            setCreatingGame(false);
        }
    };
    return (_jsxs("div", { className: "home-page", children: [_jsxs("div", { className: "home-hero", children: [_jsx("h1", { children: "Chess Dashboard" }), _jsx("p", { className: "home-subtitle", children: "Analyze your chess games with Stockfish, or challenge a friend to a live match." })] }), _jsxs("div", { className: "mode-tabs", children: [_jsxs("button", { className: `mode-tab ${mode === 'play' ? 'active' : ''}`, onClick: () => setMode('play'), children: [_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polygon", { points: "5 3 19 12 5 21 5 3" }) }), "Play a Friend"] }), _jsxs("button", { className: `mode-tab ${mode === 'pgn' ? 'active' : ''}`, onClick: () => setMode('pgn'), children: [_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), _jsx("polyline", { points: "14 2 14 8 20 8" }), _jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), _jsx("line", { x1: "16", y1: "17", x2: "8", y2: "17" })] }), "Import PGN"] }), _jsxs("button", { className: `mode-tab ${mode === 'manual' ? 'active' : ''}`, onClick: () => setMode('manual'), children: [_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), _jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })] }), "Manual Entry"] })] }), _jsx("div", { className: "upload-card", children: mode === 'play' ? (_jsxs("div", { style: { textAlign: 'center', padding: '2rem' }, children: [_jsx("h2", { children: "Play Chess Online" }), _jsx("p", { style: { marginBottom: '2rem' }, children: "Create a new match and invite any member via a shareable link." }), _jsx("button", { className: "btn btn-primary", style: { fontSize: '1.25rem', padding: '1rem 2rem' }, onClick: handlePlayFriend, disabled: creatingGame, children: creatingGame ? 'Creating...' : 'Create Live Match' })] })) : mode === 'pgn' ? (_jsx(PgnUpload, { onLoaded: handleLoaded })) : (_jsx(ManualMoveEntry, { onLoaded: handleLoaded })) }), _jsxs("div", { className: "features-grid", children: [_jsxs("div", { className: "feature-card", children: [_jsx("div", { className: "feature-icon", children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) }) }), _jsx("h3", { children: "Engine Analysis" }), _jsx("p", { children: "Every move is evaluated by Stockfish 18 running entirely in your browser." })] }), _jsxs("div", { className: "feature-card", children: [_jsx("div", { className: "feature-icon", children: _jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 6v6l4 2" })] }) }), _jsx("h3", { children: "Move Classification" }), _jsx("p", { children: "Each move is classified as blunder, mistake, inaccuracy, good, or best." })] }), _jsxs("div", { className: "feature-card", children: [_jsx("div", { className: "feature-icon", children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }) }), _jsx("h3", { children: "Save & Review" }), _jsx("p", { children: "Save games to your account and revisit them anytime." })] })] })] }));
}
