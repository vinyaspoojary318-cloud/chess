import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
const classificationColors = {
    brilliant: '#7b61ff',
    great: '#5c8bb0',
    best: '#81b64c',
    good: '#81b64c',
    inaccuracy: '#f7c948',
    mistake: '#f7a823',
    blunder: '#e23636',
};
export function MoveList() {
    const moves = useGameStore((s) => s.moves);
    const moveAnalyses = useGameStore((s) => s.moveAnalyses);
    const currentMoveIndex = useGameStore((s) => s.currentMoveIndex);
    const goToMove = useGameStore((s) => s.goToMove);
    const progress = useGameStore((s) => s.progress);
    const listRef = useRef(null);
    // Auto-scroll to current move
    useEffect(() => {
        if (listRef.current) {
            const activeItem = listRef.current.querySelector('.move-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [currentMoveIndex]);
    // Group moves into pairs (white/black)
    const movePairs = [];
    for (let i = 0; i < moves.length; i += 2) {
        const pair = { num: Math.floor(i / 2) + 1, white: moves[i], whiteIndex: i };
        if (i + 1 < moves.length) {
            pair.black = moves[i + 1];
            pair.blackIndex = i + 1;
        }
        movePairs.push(pair);
    }
    const getClassificationDot = (index) => {
        const analysis = moveAnalyses[index];
        if (!analysis || analysis.classification === 'best')
            return null;
        return (_jsx("span", { className: "classification-dot", style: {
                backgroundColor: classificationColors[analysis.classification],
                width: index === currentMoveIndex ? 10 : 6,
                height: index === currentMoveIndex ? 10 : 6,
            }, title: `${analysis.classification} (${Math.abs(analysis.swing || 0).toFixed(2)})` }));
    };
    return (_jsxs("div", { className: "move-list-container", children: [_jsxs("div", { className: "move-list-header", children: [_jsx("h3", { children: "Moves" }), progress.status === 'analyzing' && (_jsxs("span", { className: "analyzing-badge", children: ["Analyzing... ", progress.current, "/", progress.total] })), progress.status === 'done' && moveAnalyses.length > 0 && (_jsx("span", { className: "analyzed-badge", children: "Analyzed" }))] }), _jsxs("div", { className: "move-list", ref: listRef, children: [movePairs.length === 0 && (_jsx("div", { className: "move-list-empty", children: "No moves yet. Load a game to begin." })), movePairs.map((pair) => (_jsxs("div", { className: "move-pair", children: [_jsxs("span", { className: "move-number", children: [pair.num, "."] }), _jsxs("button", { className: `move-item ${currentMoveIndex === pair.whiteIndex ? 'active' : ''} ${moveAnalyses[pair.whiteIndex]?.classification || ''}`, onClick: () => goToMove(pair.whiteIndex), children: [pair.white, moveAnalyses[pair.whiteIndex] && (_jsx("span", { className: "move-swing", children: getClassificationDot(pair.whiteIndex) }))] }), pair.black !== undefined && (_jsxs("button", { className: `move-item ${currentMoveIndex === pair.blackIndex ? 'active' : ''} ${moveAnalyses[pair.blackIndex]?.classification || ''}`, onClick: () => goToMove(pair.blackIndex), children: [pair.black, moveAnalyses[pair.blackIndex] && (_jsx("span", { className: "move-swing", children: getClassificationDot(pair.blackIndex) }))] }))] }, pair.num)))] })] }));
}
