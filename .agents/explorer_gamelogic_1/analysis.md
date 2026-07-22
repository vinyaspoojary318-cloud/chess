# Chess Game Logic Analysis Report

**Target Directory**: `c:\Users\HOME\chess`
**Investigated Files**:
- `src/stores/useGameStore.ts`
- `src/types/index.ts`
- `src/components/ChessBoard.tsx`
- `src/components/ManualMoveEntry.tsx`
- `src/components/PgnUpload.tsx`
- `src/stores/useLiveGameStore.ts`

---

## Executive Summary

The game logic in the application relies on `chess.js` (version `^1.4.0`) as the underlying rule engine and validation authority, wrapped inside a `zustand` state store (`useGameStore.ts`). 

Moves are introduced into the store via two primary entry points:
1. **PGN Loading** (`loadPgn`): Parses a full PGN string using `chess.loadPgn()`.
2. **Manual Move Entry** (`addManualMoves`): Accepts an array of move SAN strings, validating each move sequentially using `chess.move()`.

The store maintains the current game state (`chess` instance, `fen`, `moves` array, `currentMoveIndex`, `moveAnalyses`, `progress`, `arrows`, `bestMove`) and exposes move navigation methods (`goToMove`, `stepForward`, `stepBackward`, `goToStart`, `goToEnd`).

---

## 1. Move Execution & Validation Architecture

### 1.1 `useGameStore.ts` Core Method Signatures & State

#### Store State Interface (`GameStore`)
```typescript
interface GameStore {
  // Game State
  chess: Chess;                    // Active chess.js instance
  fen: string;                     // Current FEN position string
  currentMoveIndex: number;        // Index in moves array (-1 = starting board position)
  moves: string[];                 // List of valid SAN move strings (e.g. ["e4", "e5", "Nf3"])
  moveAnalyses: MoveAnalysis[];    // Stockfish analysis results per move
  gameData: GameData | null;       // Full evaluated game data object

  // UI & Analysis State
  progress: AnalysisProgress;      // { current: number, total: number, status: 'idle'|'loading'|'analyzing'|'done'|'error', error?: string }
  bestMove: string | null;         // Best move LAN string (e.g. "e2e4")
  arrows: GameArrow[];             // Visual arrows array [{ startSquare, endSquare, color }]

  // Persistence State
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
```

---

### 1.2 Detailed Action Analysis

#### 1. `loadPgn(pgn: string): Promise<void>`
- **Validation**:
  1. Instantiates a new `Chess()` object.
  2. Calls `chess.loadPgn(pgn)`. If `chess.js` fails to parse the string, it throws a syntax error.
  3. `loadPgn` catches any exception and re-throws:
     `new Error('Invalid PGN format. Please check the input.')`
  4. Calls `chess.history()`. If `history.length === 0`, it throws:
     `new Error('No moves found in PGN. The game appears empty.')`
- **State Updates on Success**:
  - `chess`: New `Chess` instance loaded with PGN.
  - `fen`: FEN string of final board position (`chess.fen()`).
  - `moves`: Full list of move SAN strings (`chess.history()`).
  - `currentMoveIndex`: Set to `history.length - 1`.
  - Resets `moveAnalyses`, `gameData`, `bestMove`, `arrows`, and `progress`.

#### 2. `addManualMoves(moveSans: string[]): Promise<void>`
- **Validation**:
  1. Instantiates a fresh `Chess()` starting from the initial board position.
  2. Iterates over each SAN string in `moveSans`.
  3. Executes `chess.move(san)`. If `chess.js` rejects the move (invalid piece move, syntax error, illegal move, check violation), it throws an error.
  4. `addManualMoves` catches the error and throws:
     `new Error('Invalid move: ' + san)`
- **State Updates on Success**:
  - `chess`: `Chess` instance with all moves applied.
  - `fen`: Final position FEN string.
  - `moves`: Array of valid SAN strings.
  - `currentMoveIndex`: Set to `validMoves.length - 1`.

#### 3. `goToMove(index: number): void`
- **Logic**:
  1. Reads `moves` array from Zustand store.
  2. Instantiates a new `Chess()` instance from starting position.
  3. Replays `moves[i]` up to `index`.
  4. Triggers sound effect `playMoveByType(lastMoveSan, isCheckmate, isStalemate)`.
  5. Sets `chess` to `newChess`, `fen` to `newChess.fen()`, and `currentMoveIndex` to `index`.

---

## 2. Valid vs. Invalid Moves & Edge Cases

### 2.1 Standard Algebraic Notation (SAN) vs. Long Algebraic Notation (LAN)
- `chess.js` `chess.move()` accepts:
  - Valid SAN strings: `"e4"`, `"e5"`, `"Nf3"`, `"Nc6"`, `"Bb5"`, `"a6"`, `"Ba4"`, `"Nf6"`, `"O-O"`, `"O-O-O"`, `"exd4"`, `"e8=Q"`, `"Qxd8+"`, `"Qxf7#"`.
  - Move Objects: `{ from: 'e2', to: 'e4', promotion: 'q' }` (used in UI drag & drop in `ManualMoveEntry.tsx`).
- LAN strings (e.g. `"e2e4"`) passed directly as a string to `chess.move("e2e4")`: `chess.js` 1.x strictly expects SAN format or an object `{ from, to }`. Plain strings like `"e2e4"` may be rejected by `chess.move()` unless passed as an object or parsed into SAN.

### 2.2 Rejection Rules & Edge Cases Matrix

| Case Category | Scenario | Inputs | Behavior / Result | Handled By |
|---|---|---|---|---|
| **Invalid Piece Move** | Pawn moving backwards or diagonally without capture | `addManualMoves(['e4', 'e3'])` | Throws `Error('Invalid move: e3')` | `chess.move()` in `useGameStore.ts:105-109` |
| **Invalid Turn Order** | White moves twice consecutively | `addManualMoves(['e4', 'd4'])` | Throws `Error('Invalid move: d4')` | `chess.move()` turn enforcement |
| **Moving Into Check** | Moving king to square attacked by enemy piece | e.g. `1. f3 e5 2. g4 Ke7` (if target is attacked) | Throws `Error('Invalid move: ...')` | `chess.move()` check rules |
| **Pinned Piece Move** | Moving pinned piece exposing King | Pinned piece leaves pin ray | Throws `Error('Invalid move: ...')` | `chess.move()` king safety rules |
| **Malformed SAN Format** | Invalid coordinates or symbols | `addManualMoves(['Xz9'])` | Throws `Error('Invalid move: Xz9')` | `chess.move()` string parser |
| **Missing Promotion** | Pawn reaches 8th/1st rank without promotion piece | Move object without `promotion` key | Fails move attempt in UI | `ManualMoveEntry.tsx:113` defaults to `'q'` |
| **Empty/Header-only PGN** | PGN string with no move text | `"[Event \"Empty\"]"` | Throws `Error('No moves found in PGN. The game appears empty.')` | `useGameStore.ts:82-84` |
| **Corrupted PGN** | Invalid syntax in PGN | `"1. e4 e5 2. invalid_text"` | Throws `Error('Invalid PGN format. Please check the input.')` | `useGameStore.ts:76-78` |
| **Out-of-Bounds Navigation** | `goToMove(-5)` or `goToMove(999)` | `goToMove(-1)` or `goToMove(10)` | Replays 0 moves (resets to start) or caps replay loop at `moves.length` | `useGameStore.ts:132-146` |

---

## 3. Automated Testing Strategy for Game Logic Verification

To verify that valid moves are accepted and invalid moves are strictly rejected in `useGameStore`, an automated test script can be created without relying on UI rendering.

### 3.1 Recommended Framework & Setup
- **Runner**: `vitest` (or `tsx` / Node ESM script executing test suites).
- **Target File**: `src/stores/__tests__/useGameStore.test.ts` (or `tests/gameLogic.test.ts`).
- **Store Access**: Zustand stores can be tested directly in Node via `useGameStore.getState()`.

### 3.2 Key Test Suites & Cases

#### Suite 1: PGN Loading (`loadPgn`)
- **Valid PGN**:
  - Input: `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6`
  - Assertions:
    - `useGameStore.getState().moves` equals `['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6']`.
    - `useGameStore.getState().currentMoveIndex` equals `5`.
    - `useGameStore.getState().fen` matches final FEN `'r1bqkb1r/1pp1pppp/p1n2n2/1B6/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4'` (or valid chess.js generated FEN).
- **Invalid PGN (Syntax Error)**:
  - Input: `'1. e4 e5 2. XYZ_INVALID'`
  - Assertion: Expect `loadPgn(...)` to reject/throw with message matching `/Invalid PGN format/`.
- **Empty PGN / Header-only PGN**:
  - Input: `'[Event "Test"] [Site "Local"]'`
  - Assertion: Expect `loadPgn(...)` to reject/throw with message matching `/No moves found in PGN/`.

#### Suite 2: Manual Move Entry (`addManualMoves`)
- **Valid Moves**:
  - Sequence: `['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']`
  - Assertions: `moves.length === 5`, `currentMoveIndex === 4`.
- **Special Valid Moves**:
  - Kingside Castling: `['e4', 'e5', 'Nf3', 'Nc6', 'Be2', 'Nf6', 'O-O']` -> succeeds.
  - Pawn Promotion: Sequence leading to pawn promotion `['... e8=Q']` -> succeeds.
  - En Passant capture: Sequence leading to `exd6` -> succeeds.
- **Invalid Move Rejection**:
  - Illegal Pawn Move: `addManualMoves(['e4', 'e3'])` (White pawn backwards) -> throws `Error('Invalid move: e3')`.
  - Wrong Turn: `addManualMoves(['e4', 'd4'])` -> throws `Error('Invalid move: d4')`.
  - Invalid SAN format: `addManualMoves(['Z99'])` -> throws `Error('Invalid move: Z99')`.
  - Moving into check: White King moving into attacked square -> throws `Error('Invalid move: ...')`.

#### Suite 3: Navigation Actions
- Load 4 moves: `['e4', 'e5', 'Nf3', 'Nc6']`.
- Call `goToStart()`: `currentMoveIndex` becomes `-1`, `fen` equals starting position FEN.
- Call `stepForward()`: `currentMoveIndex` becomes `0`, `fen` matches board after `'e4'`.
- Call `goToMove(2)`: `currentMoveIndex` becomes `2`, `fen` matches board after `'Nf3'`.
- Call `stepBackward()`: `currentMoveIndex` becomes `1`, `fen` matches board after `'e5'`.
- Call `goToEnd()`: `currentMoveIndex` becomes `3`.

#### Suite 4: Store Reset
- Call `reset()`: Verify state returns to initial default values (`moves: []`, `currentMoveIndex: -1`, starting FEN).

---

## 4. Verification & Validation Checklist

- [x] Examined `src/stores/useGameStore.ts` action signatures and internal mechanics.
- [x] Examined `src/types/index.ts` data structures and types.
- [x] Examined `src/components/ChessBoard.tsx` position rendering binding.
- [x] Examined `src/components/ManualMoveEntry.tsx` and `PgnUpload.tsx` validation handling.
- [x] Documented all valid vs invalid move behaviors, error formats, and state transitions.
- [x] Defined concrete test suite design for automated testing in Milestone 2.
