import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Chess } from 'chess.js';
import { useGameStore } from '../src/stores/useGameStore';

describe('Game Logic & Move Validation', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  describe('Valid Move Processing', () => {
    it('should process standard pawn moves (e4, e5)', async () => {
      const store = useGameStore.getState();
      await store.addManualMoves(['e4', 'e5']);
      const state = useGameStore.getState();

      assert.strictEqual(state.moves.length, 2);
      assert.strictEqual(state.moves[0], 'e4');
      assert.strictEqual(state.moves[1], 'e5');
      assert.strictEqual(state.currentMoveIndex, 1);
      assert.ok(state.fen.includes('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR'));
    });

    it('should process castling moves (O-O and O-O-O)', async () => {
      const store = useGameStore.getState();
      // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O
      await store.addManualMoves(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O']);
      const state = useGameStore.getState();

      assert.strictEqual(state.moves.length, 7);
      assert.strictEqual(state.moves[6], 'O-O');
      assert.strictEqual(state.chess.get('g1')?.type, 'k');
      assert.strictEqual(state.chess.get('f1')?.type, 'r');
    });

    it('should process pawn promotion (e8=Q)', async () => {
      const store = useGameStore.getState();
      // Set up a game or PGN leading to promotion
      const chess = new Chess('4k3/4P3/8/8/8/8/8/4K3 w - - 0 1');
      chess.move('e8=Q');
      assert.strictEqual(chess.get('e8')?.type, 'q');

      await store.loadPgn('1. e4 d5 2. exd5 c6 3. dxc6 e5 4. cxb7 e4 5. bxa8=Q');
      const state = useGameStore.getState();
      assert.strictEqual(state.moves[state.moves.length - 1], 'bxa8=Q');
    });
  });

  describe('Invalid Move Rejection', () => {
    it('should reject pawn moving backwards (e4 -> e3)', async () => {
      const store = useGameStore.getState();
      await assert.rejects(async () => {
        await store.addManualMoves(['e4', 'e3']);
      }, /Invalid move/);
    });

    it('should reject wrong turn moves (e4 -> d4)', async () => {
      const store = useGameStore.getState();
      await assert.rejects(async () => {
        await store.addManualMoves(['e4', 'd4']);
      }, /Invalid move/);
    });

    it('should reject invalid SAN syntax (Z99)', async () => {
      const store = useGameStore.getState();
      await assert.rejects(async () => {
        await store.addManualMoves(['Z99']);
      }, /Invalid move/);
    });

    it('should reject illegal king move into check', () => {
      const chess = new Chess('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');
      // King cannot move to e2 (occupied by rook) or stay on e1
      // Moving to f1/d1 is fine, but moving into check is illegal
      assert.throws(() => {
        chess.move('Ke2');
      });
    });

    it('should reject invalid PGN strings', async () => {
      const store = useGameStore.getState();
      await assert.rejects(async () => {
        await store.loadPgn('This is not a valid chess PGN string!!!');
      }, /Invalid PGN/);
    });
  });

  describe('Navigation & State Management', () => {
    it('should navigate moves using goToMove, stepForward, stepBackward, and reset', async () => {
      const store = useGameStore.getState();
      await store.addManualMoves(['e4', 'e5', 'Nf3', 'Nc6']);

      // Initial state after loading 4 moves
      assert.strictEqual(useGameStore.getState().currentMoveIndex, 3);

      // goToMove(1) -> after e5
      useGameStore.getState().goToMove(1);
      assert.strictEqual(useGameStore.getState().currentMoveIndex, 1);

      // stepBackward() -> after e4
      useGameStore.getState().stepBackward();
      assert.strictEqual(useGameStore.getState().currentMoveIndex, 0);

      // stepForward() -> after e5
      useGameStore.getState().stepForward();
      assert.strictEqual(useGameStore.getState().currentMoveIndex, 1);

      // reset()
      useGameStore.getState().reset();
      const resetState = useGameStore.getState();
      assert.strictEqual(resetState.currentMoveIndex, -1);
      assert.strictEqual(resetState.moves.length, 0);
      assert.strictEqual(resetState.fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });
});
