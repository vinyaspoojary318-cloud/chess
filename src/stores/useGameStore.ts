import { create } from 'zustand';
import { Chess } from 'chess.js';
import type {
  GameData,
  MoveAnalysis,
  AnalysisProgress,
  Arrow as GameArrow,
} from '../types';
import { analyzeGame, getBestMove } from '../lib/analysis';
import { stockfishManager } from '../lib/stockfishManager';
import { playMoveByType, playAnalysisCompleteSound, playErrorSound } from '../lib/soundEffects';
import { supabase } from '../config/supabase';
import { useAuthStore } from './useAuthStore';

interface GameStore {
  // Current game state
  chess: Chess;
  fen: string;
  currentMoveIndex: number;
  moves: string[];
  moveAnalyses: MoveAnalysis[];
  gameData: GameData | null;

  // UI state
  progress: AnalysisProgress;
  bestMove: string | null;
  arrows: GameArrow[];

  // Save games
  savedGames: GameData[];
  gamesLoading: boolean;

  // Actions
  loadPgn: (pgn: string) => Promise<void>;
  addManualMoves: (moves: string[]) => Promise<void>;
  goToMove: (index: number) => void;
  goToStart: () => void;
  goToEnd: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  startAnalysis: () => Promise<void>;
  updateBestMove: () => Promise<void>;
  saveGame: () => Promise<string | null>;
  loadSavedGames: () => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  loadGameIntoReview: (gameData: GameData) => void;
  reset: () => void;
}

const createFreshChess = () => new Chess();

function convertSupabaseRow(data: any): GameData {
  return {
    ...data,
    playedAt: new Date(data.playedAt).getTime(),
  } as GameData;
}

export const useGameStore = create<GameStore>((set, get) => ({
  chess: createFreshChess(),
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  currentMoveIndex: -1,
  moves: [],
  moveAnalyses: [],
  gameData: null,
  progress: { current: 0, total: 0, status: 'idle' },
  bestMove: null,
  arrows: [],
  savedGames: [],
  gamesLoading: false,

  loadPgn: async (pgn: string) => {
    const chess = new Chess();
    try {
      chess.loadPgn(pgn);
    } catch {
      throw new Error('Invalid PGN format. Please check the input.');
    }

    // Validate that we actually have moves
    const history = chess.history();
    if (history.length === 0) {
      throw new Error('No moves found in PGN. The game appears empty.');
    }

    set({
      chess,
      fen: chess.fen(),
      moves: history,
      currentMoveIndex: history.length - 1,
      moveAnalyses: [],
      gameData: null,
      bestMove: null,
      arrows: [],
      progress: { current: 0, total: 0, status: 'idle' },
    });
  },

  addManualMoves: async (moveSans: string[]) => {
    const chess = new Chess();
    const validMoves: string[] = [];

    for (const san of moveSans) {
      try {
        chess.move(san);
        validMoves.push(san);
      } catch {
        throw new Error(`Invalid move: ${san}`);
      }
    }

    set({
      chess,
      fen: chess.fen(),
      moves: validMoves,
      currentMoveIndex: validMoves.length - 1,
      moveAnalyses: [],
      gameData: null,
      bestMove: null,
      arrows: [],
      progress: { current: 0, total: 0, status: 'idle' },
    });
  },

  goToMove: (index: number) => {
    const { moves } = get();
    const newChess = new Chess();
    let lastMoveSan = '';
    let isCheckmate = false;
    let isStalemate = false;

    for (let i = 0; i <= index && i < moves.length; i++) {
      try {
        newChess.move(moves[i]);
        if (i === index) {
          lastMoveSan = moves[i];
          // Check if this is the last move and results in game over
          if (i === moves.length - 1) {
            isCheckmate = newChess.isCheckmate();
            isStalemate = newChess.isStalemate();
          }
        }
      } catch {
        break;
      }
    }

    // Play sound effect for the move
    if (lastMoveSan) {
      playMoveByType(lastMoveSan, isCheckmate, isStalemate);
    }

    set({
      chess: newChess,
      fen: newChess.fen(),
      currentMoveIndex: index,
      arrows: [],
      bestMove: null,
    });
  },

  goToStart: () => {
    const chess = new Chess();
    set({
      chess,
      fen: chess.fen(),
      currentMoveIndex: -1,
      arrows: [],
      bestMove: null,
    });
  },

  goToEnd: () => {
    const { moves } = get();
    get().goToMove(moves.length - 1);
  },

  stepForward: () => {
    const { currentMoveIndex, moves } = get();
    if (currentMoveIndex < moves.length - 1) {
      get().goToMove(currentMoveIndex + 1);
    }
  },

  stepBackward: () => {
    const { currentMoveIndex } = get();
    if (currentMoveIndex >= 0) {
      get().goToMove(currentMoveIndex - 1);
    }
  },

  startAnalysis: async () => {
    const { moves } = get();

    set({
      progress: { current: 0, total: moves.length, status: 'analyzing' },
    });

    try {
      // Build PGN from moves
      const chess = new Chess();
      for (const san of moves) {
        chess.move(san);
      }

      const gameData = await analyzeGame(chess.pgn(), (progress) => {
        set({ progress: { ...progress, current: progress.current, total: moves.length } });
      });

      set({
        gameData,
        moveAnalyses: gameData.moves,
        progress: { current: moves.length, total: moves.length, status: 'done' },
      });
      playAnalysisCompleteSound();
    } catch (err: any) {
      set({
        progress: { current: 0, total: 0, status: 'error', error: err.message },
      });
      playErrorSound();
    }
  },

  updateBestMove: (() => {
    let lastFen = '';
    let pendingPromise: Promise<void> | null = null;
    let cancelled = false;

    return async function () {
      const { fen } = get();
      if (fen === lastFen) return;
      lastFen = fen;
      cancelled = true;

      // Wait a bit for the previous call to settle
      await new Promise(r => setTimeout(r, 100));
      if (cancelled) {
        cancelled = false;
        return;
      }

      // Cancel any pending evaluation
      if (pendingPromise) {
        stockfishManager.cancelPendingEvals();
      }

      pendingPromise = (async () => {
        try {
          const bestMove = await getBestMove(fen);
          if (bestMove && bestMove.length >= 4) {
            const from = bestMove.substring(0, 2);
            const to = bestMove.substring(2, 4);
            set({
              bestMove,
              arrows: [{
                startSquare: from,
                endSquare: to,
                color: '#81b64c',
              }],
            });
          }
        } catch {
          // Ignore best move errors
        }
      })();
    };
  })(),

  saveGame: async () => {
    const { gameData } = get();
    if (!gameData) return null;

    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.error('User not authenticated');
        return null;
      }

      const { data, error } = await supabase.from('games').insert({
        userId,
        pgn: gameData.pgn,
        playedAt: new Date().toISOString(),
        white: gameData.white,
        black: gameData.black,
        result: gameData.result,
        moves: gameData.moves,
        accuracy: gameData.accuracy,
        blunders: gameData.blunders,
        mistakes: gameData.mistakes,
        inaccuracies: gameData.inaccuracies,
        goodMoves: gameData.goodMoves,
        bestMoves: gameData.bestMoves,
      }).select().single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error('Error saving game:', err);
      return null;
    }
  },

  loadSavedGames: async () => {
    set({ gamesLoading: true });

    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        set({ gamesLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('userId', userId)
        .order('playedAt', { ascending: false });

      if (error) throw error;

      const games: GameData[] = (data || []).map(row => convertSupabaseRow(row));
      set({ savedGames: games, gamesLoading: false });
    } catch (err) {
      console.error('Error loading games:', err);
      set({ gamesLoading: false });
    }
  },

  deleteGame: async (id: string) => {
    try {
      await supabase.from('games').delete().eq('id', id);
      set((state) => ({
        savedGames: state.savedGames.filter((g) => g.id !== id),
      }));
    } catch (err) {
      console.error('Error deleting game:', err);
    }
  },

  loadGameIntoReview: (gameData: GameData) => {
    const chess = new Chess();
    chess.loadPgn(gameData.pgn);
    const history = chess.history();

    set({
      chess,
      fen: chess.fen(),
      moves: history,
      currentMoveIndex: history.length - 1,
      moveAnalyses: gameData.moves,
      gameData,
      bestMove: null,
      arrows: [],
      progress: { current: history.length, total: history.length, status: 'done' },
    });
  },

  reset: () => {
    const chess = new Chess();
    set({
      chess,
      fen: chess.fen(),
      currentMoveIndex: -1,
      moves: [],
      moveAnalyses: [],
      gameData: null,
      bestMove: null,
      arrows: [],
      progress: { current: 0, total: 0, status: 'idle' },
    });
  },
}));
