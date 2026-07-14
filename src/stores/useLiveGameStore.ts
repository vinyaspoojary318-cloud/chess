import { create } from 'zustand';
import { Chess } from 'chess.js';
import { supabase } from '../config/supabase';
import { useAuthStore } from './useAuthStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

let channel: RealtimeChannel | null = null;

export const useLiveGameStore = create<LiveGameState>((set, get) => ({
  gameId: null,
  status: 'idle',
  color: null,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves: [],
  result: null,

  createGame: async () => {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('live_games').insert({
        white: userId,
        black: null,
        status: 'waiting',
        moves: [],
        result: null
      }).select().single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error('Failed to create game:', err);
      return null;
    }
  },

  joinGame: async (gameId: string) => {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      // Fetch initial game state
      const { data, error } = await supabase
        .from('live_games')
        .select('*')
        .eq('id', gameId)
        .single();
        
      if (error || !data) {
        console.error('Game not found');
        return false;
      }

      let color: 'w' | 'b' | null = null;

      if (data.white === userId) {
        color = 'w';
      } else if (data.black === userId) {
        color = 'b';
      } else if (!data.black) {
        // Join as black
        const { error: updateErr } = await supabase
          .from('live_games')
          .update({ black: userId, status: 'playing' })
          .eq('id', gameId);
        if (updateErr) throw updateErr;
        color = 'b';
      } else {
        console.error('Game is full');
        return false;
      }

      set({ gameId, color });

      const handleGameUpdate = (payloadData: any) => {
          const chess = new Chess();
          const moveList: string[] = payloadData.moves || [];
          for (const m of moveList) {
            try { chess.move(m); } catch {}
          }

          let gameStatus = payloadData.status;
          let result = payloadData.result;

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
                supabase.from('live_games').update({ status: gameStatus, result }).eq('id', gameId).then();
              }
            }
          }

          set({
            status: gameStatus,
            moves: moveList,
            fen: chess.fen(),
            result
          });
      };

      // Trigger initial update manually
      handleGameUpdate(data);

      // Start listening
      if (channel) {
        supabase.removeChannel(channel);
      }
      
      channel = supabase.channel(`game_${gameId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'live_games', filter: `id=eq.${gameId}` },
          (payload) => {
            handleGameUpdate(payload.new);
          }
        )
        .subscribe();

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
      await supabase.from('live_games')
        .update({ moves: [...moves, san] })
        .eq('id', gameId);
    } catch (err) {
      console.error('Failed to make move:', err);
    }
  },

  leaveGame: () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
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
