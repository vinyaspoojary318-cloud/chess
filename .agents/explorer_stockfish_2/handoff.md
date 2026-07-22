# Handoff Report — Stockfish Integration Exploration

## 1. Observation
1. **`src/lib/stockfishManager.ts`**:
   - Lines 33–34: `const workerUrl = '/stockfish.worker.js#worker,worker'; this.worker = new Worker(workerUrl, { type: 'classic' });`
   - Lines 126–136: Matches engine stdout for score parsing:
     - `const cpMatch = msg.match(/score cp (-?\d+)/);`
     - `const mateMatch = msg.match(/score mate (-?\d+)/);`
   - Lines 158–159: Sends UCI commands:
     - `this.worker.postMessage('position fen ' + fen);`
     - `this.worker.postMessage('go depth ' + depth);`
   - Lines 87, 152: Single member variables `currentEvalId` and `currentEvalResult` manage active evaluation state.
2. **`src/lib/analysis.ts`**:
   - Lines 9–16:
     ```typescript
     export function classifyMove(swing: number): MoveClassification {
       const absSwing = Math.abs(swing);
       if (absSwing > 2.0) return 'blunder';
       if (absSwing > 1.0) return 'mistake';
       if (absSwing > 0.5) return 'inaccuracy';
       if (absSwing > 0.1) return 'good';
       return 'best';
     }
     ```
   - Lines 18–28:
     ```typescript
     export function swingFromEval(evalBefore: number | null, evalAfter: number | null, turn: 'w' | 'b'): number | null {
       if (evalBefore === null || evalAfter === null) return null;
       const diff = evalAfter - evalBefore;
       return turn === 'w' ? -diff : diff;
     }
     ```
   - Lines 38–43 in `calculateAccuracy`: Uses `Math.abs(move.swing!)` to calculate total penalty.
3. **`node_modules/stockfish/index.js`**:
   - Lines 7–26: Exports `initEngine(enginePath, cb)` which uses `require(pathToEngine)` and `fs` to initialize WASM engine natively in Node.js environments.
4. **`package.json`**:
   - Dependencies include `"stockfish": "^18.0.8"`, `"chess.js": "^1.4.0"`. `devDependencies` currently lacks an explicit test runner (such as `vitest`).

## 2. Logic Chain
1. *From Observation 1*: `stockfishManager.ts` uses Web `Worker` constructor pointing to browser relative URL `/stockfish.worker.js#worker,worker`. In a Node test environment, `new Worker('/stockfish.worker.js...')` will throw a runtime error because Node's `worker_threads` module requires file system paths/URLs and does not provide browser `importScripts` or URL fragment routing.
2. *From Observation 3*: The installed `stockfish` NPM package (`^18.0.8`) contains a Node entry point (`node_modules/stockfish/index.js`) that initializes the WASM engine natively using Node `fs` and `require`. Therefore, Stockfish can run in Node test scripts by importing `stockfish` NPM package directly or providing an engine abstraction adapter in `stockfishManager.ts`.
3. *From Observation 2*: In `swingFromEval`, a move by White that drops eval from +1.0 to -1.5 yields `swing = -( -1.5 - 1.0 ) = +2.5` (eval loss). A move by White that improves eval from 0.0 to +2.5 yields `swing = -( +2.5 - 0.0 ) = -2.5` (eval gain).
4. *From Observation 2*: In `classifyMove`, `const absSwing = Math.abs(swing)` is taken. For `swing = -2.5` (a 2.5 pawn gain), `absSwing` is `2.5`, which triggers `absSwing > 2.0` and classifies the move as a `'blunder'`. Similarly, `calculateAccuracy` penalizes negative swings.
5. *From Observation 2*: `MoveClassification` type includes `'brilliant'`, but `classifyMove` never returns `'brilliant'`.

## 3. Caveats
- Browser WASM performance might differ slightly from Node WASM performance depending on threads and hardware support, but both parse identical UCI protocol commands (`position fen`, `go depth`, `info score cp`, `bestmove`).
- No modifications were made to `src/` files during this investigation in accordance with read-only guidelines for Explorer.

## 4. Conclusion
1. **Stockfish Integration**: FEN evaluation and score parsing (`cp` and `mate`) are correctly implemented according to UCI protocol in `stockfishManager.ts`. However, concurrency handling should be hardened against parallel evaluation calls.
2. **Move Classification Bugs**: `classifyMove` and `calculateAccuracy` in `analysis.ts` contain critical bugs due to `Math.abs(swing)` treating evaluation gains as blunders/penalties. Fixing `classifyMove` to check `swing > 2.0` instead of `Math.abs(swing) > 2.0` will resolve this.
3. **Node vs Web Worker**: Web Worker script `/stockfish.worker.js` is browser-only. Running tests in Node requires either an engine adapter in `stockfishManager.ts` or direct usage of `require('stockfish')()` in test scripts.
4. **Automated Testing Strategy**: Installing `vitest` and writing a test suite verifying engine evaluation, move classification logic, and PGN analysis pipeline provides complete automated coverage for Milestone 3.

## 5. Verification Method
1. Inspect `src/lib/stockfishManager.ts` lines 33-35, 126-149, 154-160.
2. Inspect `src/lib/analysis.ts` lines 9-28.
3. Inspect `node_modules/stockfish/index.js` lines 7-30.
4. Inspect `c:\Users\HOME\chess\.agents\explorer_stockfish_2\analysis.md`.
