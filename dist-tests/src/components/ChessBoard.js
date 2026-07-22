import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../stores/useGameStore';
export function ChessBoard({ boardWidth }) {
    const fen = useGameStore((s) => s.fen);
    const arrows = useGameStore((s) => s.arrows);
    const progress = useGameStore((s) => s.progress);
    const updateBestMove = useGameStore((s) => s.updateBestMove);
    const containerRef = useRef(null);
    const [width, setWidth] = useState(boardWidth || 400);
    // Debounced best move update - only when position stabilizes
    useEffect(() => {
        if (progress.status !== 'done')
            return;
        const timer = setTimeout(() => {
            updateBestMove();
        }, 500);
        return () => clearTimeout(timer);
    }, [fen, progress.status, updateBestMove]);
    // Responsive sizing
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const size = Math.min(containerWidth, boardWidth || 560);
                setWidth(size);
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [boardWidth]);
    // Build arrows from store
    const boardArrows = arrows.map((a) => [a.startSquare, a.endSquare, a.color]);
    const AnyChessboard = Chessboard;
    return (_jsx("div", { ref: containerRef, className: "chess-board-container", children: _jsx(AnyChessboard, { id: "review-board", boardWidth: width, position: fen, boardOrientation: "white", areArrowsAllowed: false, customArrows: boardArrows, animationDuration: 200, customBoardStyle: {
                borderRadius: '4px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }, customDarkSquareStyle: { backgroundColor: '#769656' }, customLightSquareStyle: { backgroundColor: '#eeeed2' } }) }));
}
