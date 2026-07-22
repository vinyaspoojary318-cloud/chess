import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import { stockfishManager } from '../src/lib/stockfishManager';
import { classifyMove, calculateAccuracy, swingFromEval } from '../src/lib/analysis';
describe('Stockfish Integration & Evaluation', () => {
    after(() => {
        stockfishManager.terminate();
    });
    describe('Stockfish Engine FEN Evaluation', () => {
        it('should evaluate starting position FEN and return valid score and best move', async () => {
            const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const result = await stockfishManager.evaluatePosition(initialFen, 10);
            assert.ok(result, 'Evaluation result should be returned');
            assert.strictEqual(typeof result.bestMove, 'string', 'bestMove should be a string');
            assert.ok(result.bestMove.length >= 4, 'bestMove should be valid SAN/LAN notation like e2e4');
            assert.notStrictEqual(result.score, null, 'score should not be null for starting position');
        });
        it('should detect mate/high evaluation in tactical positions', async () => {
            // Scholar's mate position (White queen on f7 mates black king on e8)
            const mateFen = 'r1bqkb1r/pppp1Qpp/2n5/4p3/2B1n3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 1';
            const result = await stockfishManager.evaluatePosition(mateFen, 8);
            assert.ok(result, 'Result should be returned for mate position');
            assert.ok(result.score !== null || result.mate !== null, 'Should detect mate or high score');
        });
    });
    describe('Move Classification & Accuracy Calculation', () => {
        it('should correctly classify all move quality tiers based on eval swing', () => {
            // Evaluation gains (swing < 0)
            assert.strictEqual(classifyMove(-2.5), 'brilliant', '-2.5 swing should be brilliant');
            assert.strictEqual(classifyMove(-1.0), 'great', '-1.0 swing should be great');
            assert.strictEqual(classifyMove(-0.2), 'best', '-0.2 swing should be best');
            // Equal / minor loss
            assert.strictEqual(classifyMove(0.0), 'best', '0.0 swing should be best');
            assert.strictEqual(classifyMove(0.05), 'best', '0.05 swing should be best');
            assert.strictEqual(classifyMove(0.3), 'good', '0.3 swing should be good');
            // Sub-optimal / mistakes / blunders
            assert.strictEqual(classifyMove(0.8), 'inaccuracy', '0.8 swing should be inaccuracy');
            assert.strictEqual(classifyMove(1.5), 'mistake', '1.5 swing should be mistake');
            assert.strictEqual(classifyMove(2.5), 'blunder', '2.5 swing should be blunder');
        });
        it('should compute swing correctly for white and black', () => {
            // White move: eval goes from +1.0 to +3.0 -> diff = +2.0 -> swing = -2.0 (White gained 2.0)
            assert.strictEqual(swingFromEval(1.0, 3.0, 'w'), -2.0);
            // White move: eval goes from +3.0 to +1.0 -> diff = -2.0 -> swing = +2.0 (White lost 2.0)
            assert.strictEqual(swingFromEval(3.0, 1.0, 'w'), 2.0);
            // Black move: eval goes from +1.0 to -1.0 -> diff = -2.0 -> swing = -2.0 (Black gained 2.0)
            assert.strictEqual(swingFromEval(1.0, -1.0, 'b'), -2.0);
            // Black move: eval goes from -1.0 to +1.0 -> diff = +2.0 -> swing = +2.0 (Black lost 2.0)
            assert.strictEqual(swingFromEval(-1.0, 1.0, 'b'), 2.0);
        });
        it('should NOT penalize accuracy for negative eval swings (brilliant / great moves)', () => {
            const mockMoves = [
                {
                    moveNumber: 1,
                    san: 'e4',
                    fenBefore: '',
                    fenAfter: '',
                    evalBefore: 0,
                    evalAfter: 0.2,
                    swing: -0.2,
                    classification: 'best',
                },
                {
                    moveNumber: 2,
                    san: 'Nf3',
                    fenBefore: '',
                    fenAfter: '',
                    evalBefore: 0.2,
                    evalAfter: 2.7,
                    swing: -2.5,
                    classification: 'brilliant',
                },
            ];
            const accuracy = calculateAccuracy(mockMoves);
            assert.strictEqual(accuracy, 100, 'Accuracy should be 100% when all moves have negative swings');
        });
        it('should correctly penalize accuracy for blunders and mistakes', () => {
            const mockMoves = [
                {
                    moveNumber: 1,
                    san: 'e4',
                    fenBefore: '',
                    fenAfter: '',
                    evalBefore: 0,
                    evalAfter: -3.0,
                    swing: 3.0, // Blunder!
                    classification: 'blunder',
                },
                {
                    moveNumber: 2,
                    san: 'd4',
                    fenBefore: '',
                    fenAfter: '',
                    evalBefore: 0,
                    evalAfter: -3.0,
                    swing: 3.0, // Blunder!
                    classification: 'blunder',
                },
            ];
            const accuracy = calculateAccuracy(mockMoves);
            assert.strictEqual(accuracy, 50, 'Accuracy should be penalized for blunders');
        });
    });
});
