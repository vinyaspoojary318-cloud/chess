# Project: Chess Game Logic & Stockfish Integration Verification

## Architecture
- **React + TypeScript + Vite**: Frontend UI & components (`src/components`, `src/pages`)
- **State Management**: `zustand` stores (`src/stores/useGameStore.ts`, `src/stores/useLiveGameStore.ts`)
- **Game Engine Logic**: `chess.js` (`^1.4.0`) integrated into game store
- **Stockfish Engine**: `stockfish` (`^18.0.8`) integrated via `src/lib/stockfishManager.ts` & `src/lib/analysis.ts`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Analysis | Investigate codebase, game logic, Stockfish worker/manager setup, and test runner readiness | None | DONE |
| 2 | Code Fixes & Test Suite Implementation | Fix classification bugs in `analysis.ts` and Stockfish Node adapter in `stockfishManager.ts`. Write comprehensive test scripts for Game Logic (valid/invalid moves) and Stockfish Integration (eval score & classifications). Add `"test"` script to `package.json`. | M1 | IN_PROGRESS |
| 3 | Verification & Test Execution | Execute build (`npm run build`), lint (`npm run lint`), and automated tests (`npm test`). Confirm all pass cleanly. | M2 | PLANNED |
| 4 | Gate & Audit | Review, Challenger verification, Forensic Audit, and final Sentinel handoff | M3 | PLANNED |

## Code Layout
- `src/stores/useGameStore.ts` - Main game state and move handler
- `src/lib/analysis.ts` - Analysis logic & position classifications
- `src/lib/stockfishManager.ts` - Stockfish worker & engine interface
- `src/types/index.ts` - Type definitions
- `tests/gameLogic.test.ts` - Automated test suite for game logic (valid/invalid moves)
- `tests/stockfish.test.ts` - Automated test suite for Stockfish evaluation & move classification
