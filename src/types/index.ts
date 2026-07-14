import type { Chess } from 'chess.js';

export interface MoveAnalysis {
  moveNumber: number;
  san: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: number | null;
  evalAfter: number | null;
  swing: number | null;
  classification: MoveClassification;
  bestMove?: string;
}

export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface GameData {
  id?: string;
  pgn: string;
  playedAt: number;
  userId: string;
  white?: string;
  black?: string;
  result?: string;
  moves: MoveAnalysis[];
  accuracy: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  goodMoves: number;
  bestMoves: number;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  status: 'idle' | 'loading' | 'analyzing' | 'done' | 'error';
  error?: string;
}

export interface Arrow {
  startSquare: string;
  endSquare: string;
  color: string;
}

export type EvalSide = 'white' | 'black';

// Convert chess.js piece type to FEN character
export function pieceToFenChar(piece: { type: string; color: 'w' | 'b' }): string {
  return piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
}

// Get FEN string from chess instance
export function getFen(chess: Chess): string {
  return chess.fen();
}
