import { Chess } from 'chess.js';
import type { MoveAnalysis, MoveClassification, GameData, AnalysisProgress } from '../types';
import { stockfishManager } from './stockfishManager';

interface ProgressCallback {
  (progress: AnalysisProgress): void;
}

export function classifyMove(swing: number): MoveClassification {
  if (swing < -2.0) return 'brilliant';
  if (swing < -0.5) return 'great';
  if (swing > 2.0) return 'blunder';
  if (swing > 1.0) return 'mistake';
  if (swing > 0.5) return 'inaccuracy';
  if (swing > 0.1) return 'good';
  return 'best';
}

export function swingFromEval(
  evalBefore: number | null,
  evalAfter: number | null,
  turn: 'w' | 'b'
): number | null {
  if (evalBefore === null || evalAfter === null) return null;
  // For white's move: if eval goes down (positive swing in our loss metric), it's bad for white
  // For black's move: if eval goes up (positive swing in our loss metric), it's bad for black
  const diff = evalAfter - evalBefore;
  return turn === 'w' ? -diff : diff;
}

/**
 * Calculate accuracy percentage based on average swing
 */
export function calculateAccuracy(moves: MoveAnalysis[]): number {
  const classifiedMoves = moves.filter(m => m.classification && m.swing !== null);
  if (classifiedMoves.length === 0) return 100;

  let totalPenalty = 0;
  for (const move of classifiedMoves) {
    const swing = move.swing!;
    if (swing > 2.0) totalPenalty += 2.0;
    else if (swing > 1.0) totalPenalty += 1.0;
    else if (swing > 0.5) totalPenalty += 0.5;
  }

  const maxPenalty = classifiedMoves.length * 2.0;
  const accuracy = maxPenalty > 0
    ? Math.max(0, Math.min(100, 100 - (totalPenalty / maxPenalty) * 50))
    : 100;

  return Math.round(accuracy);
}

/**
 * Analyze a complete game from PGN
 */
export async function analyzeGame(
  pgn: string,
  onProgress: ProgressCallback
): Promise<GameData> {
  const chess = new Chess();

  // Load the PGN
  try {
    chess.loadPgn(pgn);
  } catch {
    throw new Error('Failed to load PGN. Please check the format.');
  }
  
  if (chess.history().length === 0) {
    throw new Error('No moves found in PGN.');
  }

  // Get game metadata
  const header = chess.header();
  const white = header['White'] || 'White';
  const black = header['Black'] || 'Black';
  const result = header['Result'] || getGameResult(chess);

  // Get all moves
  const history = chess.history({ verbose: true });
  const totalMoves = history.length;

  onProgress({
    current: 0,
    total: totalMoves,
    status: 'analyzing',
  });

  const moves: MoveAnalysis[] = [];
  const tempChess = new Chess();

  // Evaluate the initial position
  let prevEval = await evaluatePositionWithRetry(tempChess.fen());

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const fenBefore = tempChess.fen();

    // Make the move
    tempChess.move(move.san);
    const fenAfter = tempChess.fen();

    // Evaluate the position after the move
    const currentEval = await evaluatePositionWithRetry(fenAfter);

    // Calculate swing
    const turn = move.color;
    const swing = swingFromEval(prevEval, currentEval, turn as 'w' | 'b');

    const classification = swing !== null ? classifyMove(swing) : 'good';

    moves.push({
      moveNumber: Math.floor(i / 2) + 1,
      san: move.san,
      fenBefore,
      fenAfter,
      evalBefore: prevEval,
      evalAfter: currentEval,
      swing,
      classification,
    });

    prevEval = currentEval;

    onProgress({
      current: i + 1,
      total: totalMoves,
      status: 'analyzing',
    });
  }

  // Calculate stats
  const accuracy = calculateAccuracy(moves);
  const blunders = moves.filter(m => m.classification === 'blunder').length;
  const mistakes = moves.filter(m => m.classification === 'mistake').length;
  const inaccuracies = moves.filter(m => m.classification === 'inaccuracy').length;
  const goodMoves = moves.filter(m => m.classification === 'good').length;
  const bestMoves = moves.filter(m => m.classification === 'best').length;
  const greatMoves = moves.filter(m => m.classification === 'great').length;
  const brilliantMoves = moves.filter(m => m.classification === 'brilliant').length;

  onProgress({
    current: totalMoves,
    total: totalMoves,
    status: 'done',
  });

  return {
    pgn,
    playedAt: Date.now(),
    userId: '',
    white,
    black,
    result,
    moves,
    accuracy,
    blunders,
    mistakes,
    inaccuracies,
    goodMoves,
    bestMoves,
    greatMoves,
    brilliantMoves,
  };
}

function getGameResult(chess: Chess): string {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? '0-1' : '1-0';
  }
  if (chess.isDraw()) return '1/2-1/2';
  if (chess.isStalemate()) return '1/2-1/2';
  if (chess.isThreefoldRepetition()) return '1/2-1/2';
  if (chess.isInsufficientMaterial()) return '1/2-1/2';
  return '*';
}

async function evaluatePositionWithRetry(fen: string, maxRetries = 2): Promise<number | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await stockfishManager.evaluatePosition(fen, 12);
      // Give engine a bit more time for deeper analysis
      await new Promise(resolve => setTimeout(resolve, 150));

      if (result.score !== null) {
        return result.score / 100; // Convert centipawns to pawns
      }
      return null;
    } catch (err) {
      console.warn(`Eval attempt ${attempt + 1} failed:`, err);
      if (attempt === maxRetries) return null;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return null;
}

/**
 * Get the best move for a given FEN position
 */
export async function getBestMove(fen: string): Promise<string | null> {
  try {
    const result = await stockfishManager.evaluatePosition(fen, 14);
    return result.bestMove;
  } catch {
    return null;
  }
}
