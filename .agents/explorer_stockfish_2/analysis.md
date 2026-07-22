# Stockfish Integration & Analysis Engine Investigation Report

## Executive Summary
This report details the investigation of the Stockfish engine integration in `src/lib/stockfishManager.ts`, move classification and game evaluation logic in `src/lib/analysis.ts`, and evaluation display in `src/components/EvalBar.tsx`. 

Key findings include:
1. **Stockfish Engine Communication**: `stockfishManager.ts` communicates with a Web Worker (`/stockfish.worker.js#worker,worker`) using standard UCI protocol commands (`position fen <fen>`, `go depth <depth>`) and regex parsing for `info score cp`, `info score mate`, and `bestmove`.
2. **Move Classification Bugs**: `classifyMove` and `calculateAccuracy` in `analysis.ts` contain a critical flaw where `Math.abs(swing)` is used without checking the sign of the evaluation swing. As a result, moves that **improve** a player's position (negative swing) are incorrectly penalized and classified as mistakes or blunders. Furthermore, `'brilliant'` is defined in types but never returned by `classifyMove`.
3. **Environment Compatibility (Web Worker vs Node)**: `stockfishManager.ts` depends directly on the browser `Worker` API fetching web relative paths. In Node test environments, standard Web Workers fail. However, the project's installed `stockfish` NPM package (`^18.0.8`) provides a native Node initialization module (`require('stockfish')()`) that loads WASM via Node `fs` and `require`.
4. **Automated Testing Strategy**: Recommendations are provided for bridging `stockfishManager.ts` to support both Node and Browser environments and writing a comprehensive automated test script for Milestone 3.

---

## 1. Engine & Worker Loading Analysis (`stockfishManager.ts`)

### 1.1 Worker Initialization & UCI Protocol
- **File Location**: `src/lib/stockfishManager.ts` (lines 25–85)
- **Worker Instantiation**:
  ```typescript
  const workerUrl = '/stockfish.worker.js#worker,worker';
  this.worker = new Worker(workerUrl, { type: 'classic' });
  ```
- **Hash-Based Context Detection**: The URL hash `#worker,worker` is required by Emscripten-compiled `stockfish.js` (`public/stockfish.js`), which checks `self.location.hash.split(",")[1] === "worker"` to auto-initialize worker event listeners inside `public/stockfish.worker.js`.
- **Initialization Handshake**:
  - `stockfishManager` waits for incoming messages starting with `'uciok'` or `'readyok'`.
  - When received, `this.engineReady = true` and pending commands queued during initialization are dispatched.
  - A fallback timeout of 10,000 ms resolves initialization even if `uciok`/`readyok` is delayed.

### 1.2 FEN Evaluation Workflow
- **File Location**: `src/lib/stockfishManager.ts` (lines 154–204)
- **Command Dispatch**:
  ```typescript
  this.worker.postMessage(`position fen ${fen}`);
  this.worker.postMessage(`go depth ${depth}`);
  ```
- **Evaluation Tracking**: Each evaluation call generates an `evalId` (`eval_0`, `eval_1`, ...), stored in `pendingEvals` map along with `fen`, `depth`, and `callback`.

### 1.3 Parsing Engine Output (`info` and `bestmove`)
- **File Location**: `src/lib/stockfishManager.ts` (lines 89–150)
- **Regex Score Extraction**:
  - `depth`: `msg.match(/depth (\d+)/)`
  - `cp` (centipawns): `msg.match(/score cp (-?\d+)/)` -> returns integer centipawns (e.g., `150` for +1.50 pawns).
  - `mate`: `msg.match(/score mate (-?\d+)/)` -> returns mate count in moves, sets centipawn score to `+100000` (win for white) or `-100000` (win for black).
- **Completion Trigger**:
  - When engine emits `bestmove <move>` (e.g. `bestmove e2e4`), `stockfishManager` resolves the evaluation promise with `{ bestMove, score, mate, depth, fen }`.

### 1.4 Identified Vulnerabilities / Limitations in `stockfishManager.ts`
- **Race Condition in Concurrency**: `currentEvalId` and `currentEvalResult` are single member fields on the `StockfishManager` singleton. If `evaluatePosition` is invoked concurrently before the previous evaluation finishes, `currentEvalId` gets overwritten, leading to mismatched evaluation callbacks.

---

## 2. Evaluation Swing & Move Classification Analysis (`analysis.ts`)

### 2.1 Centipawns to Pawns Conversion
- **File Location**: `src/lib/analysis.ts` (lines 174–192)
- In `evaluatePositionWithRetry`, centipawn scores from `stockfishManager` are converted to pawns:
  ```typescript
  return result.score / 100; // e.g. 150 centipawns -> 1.50 pawns
  ```

### 2.2 Swing Calculation (`swingFromEval`)
- **File Location**: `src/lib/analysis.ts` (lines 18–28)
  ```typescript
  export function swingFromEval(
    evalBefore: number | null,
    evalAfter: number | null,
    turn: 'w' | 'b'
  ): number | null {
    if (evalBefore === null || evalAfter === null) return null;
    const diff = evalAfter - evalBefore;
    return turn === 'w' ? -diff : diff;
  }
  ```
- **Sign Convention**:
  - `diff = evalAfter - evalBefore` (expressed in Pawns from White's perspective).
  - For White (`turn === 'w'`): `swing = -diff = evalBefore - evalAfter`.
    - Positive `swing` means White's evaluation dropped (bad move by White).
    - Negative `swing` means White's evaluation increased (good/improving move by White).
  - For Black (`turn === 'b'`): `swing = diff = evalAfter - evalBefore`.
    - Positive `swing` means Black's evaluation dropped (eval increased in White's favor, bad move by Black).
    - Negative `swing` means Black's evaluation increased (eval decreased in Black's favor, good/improving move by Black).

### 2.3 Move Classification (`classifyMove`)
- **File Location**: `src/lib/analysis.ts` (lines 9–16)
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

### 2.4 Critical Flaws Identified in `analysis.ts`
1. **Flaw 1 — Negative Swing Misclassification**:
   - `classifyMove` uses `const absSwing = Math.abs(swing)`.
   - If a player makes a brilliant tactical move that improves their advantage by 2.5 pawns (`swing = -2.5`), `absSwing` becomes `2.5`.
   - `classifyMove` checks `absSwing > 2.0` and incorrectly classifies the move as a **blunder**!
   - **Fix Required**: Only positive swings (evaluation losses) should be classified as inaccuracies/mistakes/blunders:
     ```typescript
     export function classifyMove(swing: number): MoveClassification {
       if (swing > 2.0) return 'blunder';
       if (swing > 1.0) return 'mistake';
       if (swing > 0.5) return 'inaccuracy';
       if (swing > 0.1) return 'good';
       return 'best';
     }
     ```
2. **Flaw 2 — Accuracy Calculation Penalty Bug**:
   - In `calculateAccuracy` (lines 33–51), `const absSwing = Math.abs(move.swing!)` is used to add penalties. Improving moves (`swing < 0`) penalize overall player accuracy.
3. **Flaw 3 — Unused `'brilliant'` Classification**:
   - `MoveClassification` type includes `'brilliant'`, but `classifyMove` contains no logic to assign `'brilliant'`.

---

## 3. Node Environment vs Web Worker Environment

### 3.1 Web Worker Environment (Browser)
- Utilizes `window.Worker` and web relative paths (`/stockfish.worker.js#worker,worker`).
- Emscripten glue code (`public/stockfish.js`) fetches `/stockfish.wasm` over HTTP.

### 3.2 Node.js Environment (Test Runner)
- Browser `Worker` with web paths (`/stockfish.worker.js#worker,worker`) is unavailable in Node.js.
- However, the `stockfish` NPM package installed in `node_modules/stockfish` (`v18.0.8`) contains a Node entrypoint (`index.js`).
- `node_modules/stockfish/index.js` uses Node `fs` and `require` to load `node_modules/stockfish/bin/stockfish.js` and `stockfish.wasm`.
- When initialized via `const initEngine = require('stockfish'); const engine = await initEngine();`, it returns an engine instance featuring `.postMessage(cmd)` and `.onmessage` handler matching the Web Worker message API.

---

## 4. Recommended Automated Testing Strategy for Milestone 3

### 4.1 Recommended Test Runner
- **Vitest**: Fast, native TypeScript support, compatible with Vite setup in `vite.config.ts`.

### 4.2 Stockfish Integration Abstraction for Node Test Compatibility
To allow `stockfishManager.ts` and `analysis.ts` to run seamlessly in Node test runners:
1. Abstract engine creation in `stockfishManager.ts`:
   ```typescript
   export interface StockfishEngine {
     postMessage(cmd: string): void;
     onmessage: ((e: { data: string } | string) => void) | null;
     terminate?(): void;
   }
   ```
2. In browser, instantiate standard `Worker`.
3. In Node test environment (or fallback), instantiate `stockfish` NPM package via `require('stockfish')()` or `import initEngine from 'stockfish'`.

### 4.3 Proposed Test Suite Scope
Create automated test script `tests/stockfish.test.ts` (or `scripts/verify-stockfish.ts`) verifying:
1. **Engine FEN Evaluation**:
   - Pass starting position `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1` -> assert `score` is near 0 and `bestMove` is non-null.
   - Pass tactical position -> assert evaluation score reflects winning advantage.
2. **Move Classification Logic**:
   - Unit test `swingFromEval` and `classifyMove` with controlled eval inputs (blunder, mistake, inaccuracy, good, best).
   - Verify fixed logic correctly identifies blunders (`swing > 2.0`) without penalizing position improvements (`swing < 0`).
3. **Full Game Analysis Pipeline**:
   - Run `analyzeGame(pgn)` on a short sample PGN -> verify all moves receive `evalBefore`, `evalAfter`, `swing`, and `classification`.

