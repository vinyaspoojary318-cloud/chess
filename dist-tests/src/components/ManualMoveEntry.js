import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { stockfishManager } from '../lib/stockfishManager';
export function ManualMoveEntry({ onLoaded }) {
    const [moveInput, setMoveInput] = useState('');
    const [movesList, setMovesList] = useState([]);
    const [error, setError] = useState('');
    const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const [bestMoveArrow, setBestMoveArrow] = useState([]);
    const addManualMoves = useGameStore((s) => s.addManualMoves);
    useEffect(() => {
        let active = true;
        const evaluate = async () => {
            try {
                const result = await stockfishManager.evaluatePosition(fen, 14);
                if (active && result.bestMove && result.bestMove.length >= 4) {
                    const from = result.bestMove.substring(0, 2);
                    const to = result.bestMove.substring(2, 4);
                    setBestMoveArrow([[from, to, '#81b64c']]);
                }
                else if (active) {
                    setBestMoveArrow([]);
                }
            }
            catch {
                if (active)
                    setBestMoveArrow([]);
            }
        };
        const timer = setTimeout(evaluate, 500);
        return () => {
            active = false;
            clearTimeout(timer);
            stockfishManager.cancelPendingEvals();
        };
    }, [fen]);
    const handleAddMove = () => {
        const san = moveInput.trim();
        if (!san)
            return;
        try {
            const testChess = new Chess();
            // Replay all existing moves
            for (const m of movesList) {
                testChess.move(m);
            }
            testChess.move(san);
            setMovesList([...movesList, san]);
            setFen(testChess.fen());
            setMoveInput('');
            setError('');
        }
        catch {
            setError(`Invalid move: "${san}". Please use standard algebraic notation (e.g., e4, Nf3, O-O).`);
        }
    };
    const handleRemoveLast = () => {
        const newMoves = movesList.slice(0, -1);
        setMovesList(newMoves);
        const testChess = new Chess();
        for (const m of newMoves) {
            testChess.move(m);
        }
        setFen(testChess.fen());
        setError('');
    };
    const handleClear = () => {
        setMovesList([]);
        setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        setError('');
    };
    const handleAnalyze = async () => {
        if (movesList.length === 0) {
            setError('Add at least one move to analyze');
            return;
        }
        try {
            await addManualMoves(movesList);
            onLoaded();
        }
        catch (err) {
            setError(err.message);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddMove();
        }
    };
    const onPieceDrop = (sourceSquare, targetSquare, piece) => {
        try {
            const testChess = new Chess();
            for (const m of movesList) {
                testChess.move(m);
            }
            // Try to construct move object
            const move = testChess.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: piece[1].toLowerCase() ?? 'q',
            });
            if (move) {
                setMovesList([...movesList, move.san]);
                setFen(testChess.fen());
                setError('');
                return true;
            }
        }
        catch {
            // invalid move
        }
        return false;
    };
    // Build display text for moves
    const moveDisplay = [];
    for (let i = 0; i < movesList.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        let text = `${moveNum}. ${movesList[i]}`;
        if (i + 1 < movesList.length) {
            text += ` ${movesList[i + 1]}`;
        }
        moveDisplay.push(text);
    }
    const AnyChessboard = Chessboard;
    return (_jsxs("div", { className: "manual-move-entry", style: { display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }, children: [_jsx("div", { style: { flex: '1', minWidth: '300px', maxWidth: '400px' }, children: _jsx(AnyChessboard, { position: fen, onPieceDrop: onPieceDrop, customArrows: bestMoveArrow, animationDuration: 200, customBoardStyle: {
                        borderRadius: '4px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    }, customDarkSquareStyle: { backgroundColor: '#769656' }, customLightSquareStyle: { backgroundColor: '#eeeed2' } }) }), _jsxs("div", { style: { flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { marginTop: 0 }, children: "Manual Entry" }), _jsx("p", { className: "manual-instruction", children: "Enter moves using standard algebraic notation or drag pieces on the board. The engine will evaluate the position and draw an arrow for the best move." })] }), _jsxs("div", { className: "manual-input-row", style: { display: 'flex', gap: '0.5rem' }, children: [_jsx("input", { type: "text", className: "move-input", placeholder: "e.g., e4", value: moveInput, onChange: (e) => setMoveInput(e.target.value), onKeyDown: handleKeyDown, disabled: movesList.length >= 500, style: { flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' } }), _jsx("button", { className: "btn btn-primary btn-sm", onClick: handleAddMove, disabled: movesList.length >= 500, children: "Add" }), _jsx("button", { className: "btn btn-secondary btn-sm", onClick: handleRemoveLast, disabled: movesList.length === 0, children: "Undo" }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: handleClear, disabled: movesList.length === 0, children: "Clear" })] }), error && _jsx("div", { className: "pgn-error", style: { color: 'red' }, children: error }), _jsx("div", { className: "manual-moves-preview", style: {
                            background: 'rgba(0, 0, 0, 0.05)',
                            padding: '1rem',
                            borderRadius: '4px',
                            minHeight: '100px',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }, children: moveDisplay.length > 0 ? (_jsx("div", { className: "moves-preview-text", style: { lineHeight: '1.5' }, children: moveDisplay.join('  ') })) : (_jsx("div", { className: "moves-preview-empty", style: { opacity: 0.6 }, children: "No moves entered yet" })) }), movesList.length > 0 && (_jsxs("button", { className: "btn btn-primary", onClick: handleAnalyze, style: { width: '100%', padding: '0.75rem', marginTop: 'auto' }, children: ["Analyze ", movesList.length, " Move", movesList.length !== 1 ? 's' : ''] }))] })] }));
}
