import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useLiveGameStore } from '../stores/useLiveGameStore';
import { useGameStore } from '../stores/useGameStore';
export function PlayPage() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { status, color, fen, moves, joinGame, makeMove, leaveGame, result } = useLiveGameStore();
    const addManualMoves = useGameStore((s) => s.addManualMoves);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!gameId) {
            navigate('/');
            return;
        }
        const init = async () => {
            const success = await joinGame(gameId);
            if (!success) {
                setError('Failed to join game. It may be full or not exist.');
            }
            setLoading(false);
        };
        init();
        return () => {
            leaveGame();
        };
    }, [gameId, joinGame, leaveGame, navigate]);
    const onPieceDrop = (sourceSquare, targetSquare, piece) => {
        if (status !== 'playing')
            return false;
        const chess = new Chess();
        // Load current fen by applying moves (to ensure correct turn and history)
        for (const m of moves) {
            try {
                chess.move(m);
            }
            catch { }
        }
        // Only allow move if it's our turn
        if (chess.turn() !== color)
            return false;
        try {
            const move = chess.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: piece[1].toLowerCase() ?? 'q',
            });
            if (move) {
                makeMove(move.san);
                return true;
            }
        }
        catch {
            // Invalid move
        }
        return false;
    };
    const handleAnalyze = async () => {
        if (moves.length === 0)
            return;
        try {
            await addManualMoves(moves);
            navigate('/review');
        }
        catch (err) {
            setError(err.message);
        }
    };
    if (loading)
        return _jsx("div", { style: { textAlign: 'center', marginTop: '2rem' }, children: "Loading game..." });
    if (error)
        return _jsx("div", { style: { color: 'red', textAlign: 'center', marginTop: '2rem' }, children: error });
    const inviteLink = `${window.location.origin}/play/${gameId}`;
    const isOurTurn = () => {
        const chess = new Chess();
        for (const m of moves) {
            try {
                chess.move(m);
            }
            catch { }
        }
        return chess.turn() === color;
    };
    const AnyChessboard = Chessboard;
    return (_jsxs("div", { className: "play-page", style: { padding: '2rem', maxWidth: '800px', margin: '0 auto' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }, children: [_jsx("h2", { children: "Live Match" }), status === 'waiting' && (_jsxs("div", { style: { background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '4px' }, children: [_jsx("span", { children: "Waiting for opponent... Share this link: " }), _jsx("input", { readOnly: true, value: inviteLink, style: { width: '250px', padding: '0.25rem', marginLeft: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }, onClick: (e) => e.target.select() })] })), status === 'playing' && (_jsx("div", { style: { fontWeight: 'bold', color: isOurTurn() ? '#4ade80' : '#9ca3af' }, children: isOurTurn() ? "Your turn!" : "Opponent's turn" })), status === 'finished' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsxs("span", { style: { fontWeight: 'bold' }, children: ["Game Over! Result: ", result] }), _jsx("button", { className: "btn btn-primary btn-sm", onClick: handleAnalyze, children: "Analyze Game" })] }))] }), _jsxs("div", { style: { display: 'flex', gap: '2rem' }, children: [_jsx("div", { style: { flex: '1', maxWidth: '600px' }, children: _jsx(AnyChessboard, { position: fen, onPieceDrop: onPieceDrop, boardOrientation: color === 'b' ? 'black' : 'white', animationDuration: 200, customBoardStyle: {
                                borderRadius: '4px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                            }, customDarkSquareStyle: { backgroundColor: '#769656' }, customLightSquareStyle: { backgroundColor: '#eeeed2' } }) }), _jsxs("div", { style: { width: '200px', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '4px', maxHeight: '600px', overflowY: 'auto' }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Moves" }), moves.length === 0 ? (_jsx("p", { style: { opacity: 0.5 }, children: "No moves yet" })) : (_jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }, children: moves.map((m, i) => (_jsxs("div", { style: { display: 'flex' }, children: [i % 2 === 0 && _jsxs("span", { style: { marginRight: '0.5rem', opacity: 0.5 }, children: [Math.floor(i / 2) + 1, "."] }), _jsx("span", { children: m })] }, i))) }))] })] })] }));
}
