import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChessBoard } from '../components/ChessBoard';
import { MoveList } from '../components/MoveList';
import { EvalBar } from '../components/EvalBar';
import { useGameStore } from '../stores/useGameStore';
export function ReviewPage() {
    const navigate = useNavigate();
    const moves = useGameStore((s) => s.moves);
    const progress = useGameStore((s) => s.progress);
    const currentMoveIndex = useGameStore((s) => s.currentMoveIndex);
    const gameData = useGameStore((s) => s.gameData);
    const startAnalysis = useGameStore((s) => s.startAnalysis);
    const goToStart = useGameStore((s) => s.goToStart);
    const goToEnd = useGameStore((s) => s.goToEnd);
    const stepForward = useGameStore((s) => s.stepForward);
    const stepBackward = useGameStore((s) => s.stepBackward);
    const saveGame = useGameStore((s) => s.saveGame);
    // Start analysis when the review page loads and moves exist
    useEffect(() => {
        if (moves.length > 0 && progress.status === 'idle') {
            startAnalysis();
        }
    }, [moves.length, progress.status, startAnalysis]);
    // Navigate to summary when analysis is done
    useEffect(() => {
        if (progress.status === 'done' && gameData) {
            navigate('/summary', { replace: true });
        }
    }, [progress.status, gameData, navigate]);
    const handleSave = async () => {
        const id = await saveGame();
        if (id) {
            alert('Game saved successfully!');
        }
        else {
            alert('Failed to save game. Check console for details.');
        }
    };
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            switch (e.key) {
                case 'ArrowLeft':
                case 'j':
                    stepBackward();
                    break;
                case 'ArrowRight':
                case 'k':
                    stepForward();
                    break;
                case 'Home':
                    goToStart();
                    break;
                case 'End':
                    goToEnd();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [stepBackward, stepForward, goToStart, goToEnd]);
    if (moves.length === 0) {
        navigate('/');
        return null;
    }
    return (_jsxs("div", { className: "review-page", children: [_jsxs("div", { className: "review-header", children: [_jsxs("div", { className: "review-info", children: [_jsx("h2", { children: "Game Review" }), _jsxs("span", { className: "move-count", children: [moves.length, " move", moves.length !== 1 ? 's' : '', progress.status === 'analyzing' && (_jsxs("span", { className: "analyzing-text", children: [" \u2014 Analyzing... (", progress.current, "/", progress.total, ")"] }))] })] }), _jsxs("div", { className: "review-actions", children: [gameData && progress.status === 'done' && (_jsx("button", { className: "btn btn-secondary btn-sm", onClick: handleSave, children: "Save Game" })), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => navigate('/summary', { state: { fromReview: true } }), children: "View Summary" })] })] }), _jsxs("div", { className: "review-layout", children: [_jsxs("div", { className: "review-board-section", children: [_jsxs("div", { className: "board-and-eval", children: [_jsx(EvalBar, {}), _jsx(ChessBoard, {})] }), _jsxs("div", { className: "board-controls", children: [_jsx("button", { className: "control-btn", onClick: goToStart, title: "Go to start (Home)", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("polyline", { points: "11 17 6 12 11 7" }), _jsx("polyline", { points: "18 17 13 12 18 7" })] }) }), _jsx("button", { className: "control-btn", onClick: stepBackward, title: "Step backward (\u2190)", children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("polyline", { points: "15 18 9 12 15 6" }) }) }), _jsxs("div", { className: "move-indicator", children: [currentMoveIndex + 1, " / ", moves.length] }), _jsx("button", { className: "control-btn", onClick: stepForward, title: "Step forward (\u2192)", children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("polyline", { points: "9 18 15 12 9 6" }) }) }), _jsx("button", { className: "control-btn", onClick: goToEnd, title: "Go to end (End)", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("polyline", { points: "13 17 18 12 13 7" }), _jsx("polyline", { points: "6 17 11 12 6 7" })] }) })] })] }), _jsx("div", { className: "review-sidebar", children: _jsx(MoveList, {}) })] })] }));
}
