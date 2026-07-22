// Convert chess.js piece type to FEN character
export function pieceToFenChar(piece) {
    return piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
}
// Get FEN string from chess instance
export function getFen(chess) {
    return chess.fen();
}
