import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { Chess } from 'chess.js';
import { playSuccessSound, playErrorSound } from '../lib/soundEffects';
export function PgnUpload({ onLoaded }) {
    const [pgnText, setPgnText] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);
    const loadPgn = useGameStore((s) => s.loadPgn);
    const handleLoad = async () => {
        if (!pgnText.trim()) {
            setError('Please enter a PGN string');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Validate PGN with chess.js
            const testChess = new Chess();
            testChess.loadPgn(pgnText);
            await loadPgn(pgnText);
            setSuccess(true);
            playSuccessSound();
            setTimeout(() => onLoaded(), 500);
        }
        catch (err) {
            setError(err.message || 'Failed to load PGN');
            playErrorSound();
        }
        finally {
            setLoading(false);
        }
    };
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            setPgnText(content);
            setError('');
        };
        reader.onerror = () => {
            setError('Failed to read file');
            playErrorSound();
        };
        reader.readAsText(file);
    };
    const handleSampleGame = () => {
        const samplePgn = `[Event "Casual Game"]
[Site "Online"]
[Date "2024.01.15"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 h6 16. Bd2 c5 17. d5 c4 18. a4 Qc7 19. Qe2 Nb6 20. axb5 axb5 21. Rxa8 Bxa8 22. Ra1 Bb7 23. Qe3 Nfd7 24. Be1 Qc8 25. Qd2 Nc5 26. b3 cxb3 27. Bxb3 Nxb3 28. Qxb3 Qc7 29. Qd3 f5 30. exf5 gxf5 31. Nh4 Bf6 32. Nxf5 Bxh4 33. Nxh6+ Kg7 34. Nf5+ Kg6 35. Bxh4 Qf7 36. Qg3+ Kf6 37. Qg5+ Ke6 38. Re1+ Kd7 39. Nxd6 Qf8 40. Qxf5+ Kc7 41. Nc4 Qe7 42. d6+ Qxd6 43. Nxd6 Kxd6 44. Qf6+ Kd5 45. Qe5+ Kc4 46. Qxb5+ Kd4 47. Qd5+ Ke3 48. Re1+ Kf2 49. Qd2+ Kg1 50. Rxe8# 1-0`;
        setPgnText(samplePgn);
        setError('');
    };
    return (_jsxs("div", { className: "pgn-upload", children: [_jsx("h2", { children: "Import Game" }), _jsx("p", { className: "pgn-instruction", children: "Paste a PGN string below to load a chess game for analysis." }), _jsxs("div", { className: "pgn-input-group", children: [_jsx("textarea", { className: "pgn-textarea", placeholder: "1. e4 e5 2. Nf3 Nc6 ...", value: pgnText, onChange: (e) => {
                            setPgnText(e.target.value);
                            setError('');
                            setSuccess(false);
                        }, rows: 8, spellCheck: false }), error && _jsx("div", { className: "pgn-error", children: error }), success && _jsx("div", { className: "pgn-success", children: "Game loaded successfully!" })] }), _jsxs("div", { className: "pgn-actions", children: [_jsx("button", { className: "btn btn-primary", onClick: handleLoad, disabled: loading || !pgnText.trim(), children: loading ? 'Loading...' : 'Analyze Game' }), _jsx("button", { className: "btn btn-secondary", onClick: () => fileInputRef.current?.click(), children: "Upload PGN File" }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".pgn,.txt", onChange: handleFileUpload, style: { display: 'none' } }), _jsx("button", { className: "btn btn-ghost", onClick: handleSampleGame, children: "Load Sample Game" })] })] }));
}
