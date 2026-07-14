import { create } from 'zustand';
import { Chess } from 'chess.js';
import { initFirebase, getDb } from '../config/firebase';
import { useAuthStore } from './useAuthStore';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';

interface LiveGameState {
  gameId: string | null;
  status: 'idle' | 'waiting' | 'playing' | 'finished';
  color: 'w' | 'b' | null;
  fen: string;
  moves: string[];
  result: string | null;
  
  createGame: () => Promise<string | null>;
  joinGame: (gameId: string) => Promise<boolean>;
  makeMove: (san: string) => Promise<void>;
  leaveGame: () => void;
}

let unsubscribe: Unsubscribe | null = null;

export const useLiveGameStore = create<LiveGameState>((set, get) => ({
  gameId: null,
  status: 'idle',
  color: null,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves: [],
  result: null,

  createGame: async () => {
    try {
      initFirebase();
      const db = getDb();
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) throw new Error('Not authenticated');

      const docRef = await addDoc(collection(db, 'live_games'), {
        white: userId,
        black: null,
        status: 'waiting',
        moves: [],
        createdAt: serverTimestamp(),
        result: null
      });

      return docRef.id;
    } catch (err) {
      console.error('Failed to create game:', err);
      return null;
    }
  },

  joinGame: async (gameId: string) => {
    try {
      initFirebase();
      const db = getDb();
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) throw new Error('Not authenticated');

      const docRef = doc(db, 'live_games', gameId);
      const gameSnap = await getDoc(docRef);
      
      if (!gameSnap.exists()) {
        console.error('Game not found');
        return false;
      }

      const data = gameSnap.data();
      let color: 'w' | 'b' | null = null;

      if (data.white === userId) {
        color = 'w';
      } else if (data.black === userId) {
        color = 'b';
      } else if (!data.black) {
        // Join as black
        await updateDoc(docRef, {
          black: userId,
          status: 'playing'
        });
        color = 'b';
      } else {
        // Game is full, could be a spectator, but we just fail for now
        console.error('Game is full');
        return false;
      }

      set({ gameId, color });

      // Start listening
      if (unsubscribe) unsubscribe();
      
      unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const snapData = snap.data();
          
          // Rebuild FEN from moves
          const chess = new Chess();
          const moveList: string[] = snapData.moves || [];
          for (const m of moveList) {
            try {
              chess.move(m);
            } catch {
              // Ignore invalid moves that somehow got in
            }
          }

          let gameStatus = snapData.status;
          let result = snapData.result;

          // Check for auto-finish
          if (gameStatus === 'playing') {
            if (chess.isCheckmate() || chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
              gameStatus = 'finished';
              if (chess.isCheckmate()) {
                result = chess.turn() === 'w' ? '0-1' : '1-0';
              } else {
                result = '1/2-1/2';
              }
              // Update db if we are one of the players
              if (color) {
                updateDoc(docRef, { status: gameStatus, result }).catch(() => {});
              }
            }
          }

          set({
            status: gameStatus,
            moves: moveList,
            fen: chess.fen(),
            result
          });
        }
      });

      return true;
    } catch (err) {
      console.error('Failed to join game:', err);
      return false;
    }
  },

  makeMove: async (san: string) => {
    const { gameId, status, moves } = get();
    if (!gameId || status !== 'playing') return;

    try {
      const db = getDb();
      const docRef = doc(db, 'live_games', gameId);
      
      await updateDoc(docRef, {
        moves: [...moves, san]
      });
    } catch (err) {
      console.error('Failed to make move:', err);
    }
  },

  leaveGame: () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    set({
      gameId: null,
      status: 'idle',
      color: null,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: [],
      result: null
    });
  }
}));
