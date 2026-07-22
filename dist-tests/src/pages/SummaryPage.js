import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/useGameStore';
export function SummaryPage() {
    const navigate = useNavigate();
    const gameData = useGameStore((s) => s.gameData);
    const moves = useGameStore((s) => s.moves);
    const loadGameIntoReview = useGameStore((s) => s.loadGameIntoReview);
    if (!gameData) {
        return (_jsx("div", { className: "summary-page", children: _jsxs("div", { className: "summary-empty", children: [_jsx("h2", { children: "No Analysis Data" }), _jsx("p", { children: "Load and analyze a game first to see the summary." }), _jsx("button", { className: "btn btn-primary", onClick: () => navigate('/'), children: "Go Home" })] }) }));
    }
    const classificationData = [
        {
            label: 'Brilliant Moves',
            count: gameData.brilliantMoves || 0,
            color: '#7b61ff',
            description: 'Huge eval gain (> 2.0 pawns)',
            icon: '!!',
        },
        {
            label: 'Great Moves',
            count: gameData.greatMoves || 0,
            color: '#5c8bb0',
            description: 'Eval gain (0.5–2.0 pawns)',
            icon: '!',
        },
        {
            label: 'Best Moves',
            count: gameData.bestMoves,
            color: '#81b64c',
            description: 'Optimal engine move',
            icon: '★',
        },
        {
            label: 'Good Moves',
            count: gameData.goodMoves,
            color: '#81b64c',
            description: 'Minor eval swing (0.1–0.5 pawns)',
            icon: '',
        },
        {
            label: 'Inaccuracies',
            count: gameData.inaccuracies,
            color: '#f7c948',
            description: 'Eval swing 0.5–1.0 pawns',
            icon: '?!',
        },
        {
            label: 'Mistakes',
            count: gameData.mistakes,
            color: '#f7a823',
            description: 'Eval swing 1.0–2.0 pawns',
            icon: '?',
        },
        {
            label: 'Blunders',
            count: gameData.blunders,
            color: '#e23636',
            description: 'Eval swing > 2.0 pawns',
            icon: '??',
        },
    ];
    const maxCount = Math.max(...classificationData.map((d) => d.count), 1);
    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 90)
            return '#81b64c';
        if (accuracy >= 75)
            return '#f7c948';
        if (accuracy >= 50)
            return '#f7a823';
        return '#e23636';
    };
    const handleReviewGame = () => {
        if (gameData) {
            loadGameIntoReview(gameData);
            navigate('/review');
        }
    };
    return (_jsxs("div", { className: "summary-page", children: [_jsxs("div", { className: "summary-header", children: [_jsx("h2", { children: "Game Summary" }), _jsxs("div", { className: "game-meta", children: [_jsxs("span", { children: [gameData.white || 'White', " vs ", gameData.black || 'Black'] }), _jsx("span", { className: "game-result", children: gameData.result }), _jsxs("span", { children: [moves.length, " moves"] })] })] }), _jsx("div", { className: "accuracy-section", children: _jsxs("div", { className: "accuracy-circle", style: { borderColor: getAccuracyColor(gameData.accuracy) }, children: [_jsxs("span", { className: "accuracy-value", style: { color: getAccuracyColor(gameData.accuracy) }, children: [gameData.accuracy, "%"] }), _jsx("span", { className: "accuracy-label", children: "Accuracy" })] }) }), _jsxs("div", { className: "classification-breakdown", children: [_jsx("h3", { children: "Move Quality" }), _jsx("div", { className: "classification-bars", children: classificationData.map((item) => (_jsxs("div", { className: "classification-row", children: [_jsxs("div", { className: "classification-label", children: [_jsxs("span", { className: "classification-name", children: [item.icon && _jsx("span", { className: "class-icon", children: item.icon }), item.label] }), _jsx("span", { className: "classification-count", children: item.count })] }), _jsx("div", { className: "classification-bar-track", children: _jsx("div", { className: "classification-bar-fill", style: {
                                            width: `${(item.count / maxCount) * 100}%`,
                                            backgroundColor: item.color,
                                        } }) }), _jsx("div", { className: "classification-description", children: item.description })] }, item.label))) })] }), _jsxs("div", { className: "summary-actions", children: [_jsx("button", { className: "btn btn-primary", onClick: handleReviewGame, children: "Review Moves" }), _jsx("button", { className: "btn btn-secondary", onClick: () => navigate('/'), children: "New Game" })] })] }));
}
