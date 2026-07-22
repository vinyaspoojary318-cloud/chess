# Orchestration Execution Plan

## Objectives
1. Verify Chess Game Logic: Test script or automated verification that valid chess moves are accepted and invalid moves are rejected.
2. Verify Stockfish Integration: Test script or automated verification that Stockfish engine evaluates FEN positions and returns classifications ('brilliant', 'good', 'blunder', etc.).

## Phase 1: Exploration
- Dispatch `teamwork_preview_explorer` agents to inspect:
  - `stores/useGameStore.ts` & game logic implementation
  - `lib/analysis.ts` & `lib/stockfishManager.ts` Stockfish evaluation logic
  - Existing package scripts, test setups, or runners
  - Produce initial findings and recommendation report.

## Phase 2: Implementation & Execution (Worker)
- Dispatch `teamwork_preview_worker` to:
  - Create/run test script(s) for Chess Game Logic (valid and invalid moves).
  - Create/run test script(s) for Stockfish Integration (FEN evaluation & position classifications).
  - Run build and unit tests to ensure everything builds and passes.

## Phase 3: Review & Verification
- Dispatch `teamwork_preview_reviewer` to review test scripts, logic coverage, and test results.
- Dispatch `teamwork_preview_challenger` to independently execute tests and verify accuracy.
- Dispatch `teamwork_preview_auditor` to conduct forensic integrity verification.

## Phase 4: Final Gate & Reporting
- Check all gate criteria:
  1. Build and tests pass.
  2. Reviewer verdicts pass.
  3. Challenger confirms correctness.
  4. Forensic Auditor verdict is CLEAN.
- Claim victory and report back to Sentinel (`main agent`).
