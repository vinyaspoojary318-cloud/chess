type EvalCallback = (result: StockfishEvalResult) => void;

export interface StockfishEvalResult {
  bestMove: string | null;
  score: number | null; // in centipawns
  mate: number | null;
  depth: number;
  fen: string;
}

class StockfishManager {
  private worker: Worker | null = null;
  private pendingEvals: Map<string, {
    fen: string;
    depth: number;
    callback: EvalCallback;
    startTime: number;
  }> = new Map();
  private evalIdCounter = 0;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private engineReady = false;
  private pendingCommands: Array<{ fen: string; depth: number; evalId: string; callback: EvalCallback }> = [];

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        // Create a classic worker with a hash that stockfish.js detects
        // stockfish.js checks: self.location.hash.split(",")[1] === "worker"
        const workerUrl = '/stockfish.worker.js#worker,worker';
        this.worker = new Worker(workerUrl, { type: 'classic' });

        let readyTimeout: ReturnType<typeof setTimeout>;

        this.worker.onmessage = (e: MessageEvent) => {
          const msg = e.data;

          if (typeof msg !== 'string') return;

          // Check for engine initialization messages
          if (msg.startsWith('uciok') || msg.startsWith('readyok')) {
            this.engineReady = true;
            clearTimeout(readyTimeout);
            this.isInitialized = true;
            resolve();

            // Process any pending evaluations
            for (const pending of this.pendingCommands) {
              this.sendEvalCommand(pending.fen, pending.depth, pending.evalId);
            }
            this.pendingCommands = [];
            return;
          }

          // Handle engine output
          this.handleEngineOutput(msg);
        };

        this.worker.onerror = (err) => {
          console.error('Stockfish worker error:', err);
          clearTimeout(readyTimeout);
          if (!this.isInitialized) {
            reject(new Error('Stockfish worker failed to initialize'));
          }
        };

        // Timeout for initialization
        readyTimeout = setTimeout(() => {
          if (!this.engineReady) {
            console.warn('Stockfish init timed out, trying anyway...');
            this.engineReady = true;
            this.isInitialized = true;
            resolve();
          }
        }, 10000);
      } catch (err) {
        reject(err);
      }
    });

    return this.initPromise;
  }

  private currentEvalId: string | null = null;

  private handleEngineOutput(msg: string) {
    if (typeof msg !== 'string') return;

    // Check for bestmove
    if (msg.startsWith('bestmove')) {
      const parts = msg.split(' ');
      const bestMove = parts[1];

      if (this.currentEvalId) {
        const pending = this.pendingEvals.get(this.currentEvalId);
        if (pending) {
          const existingResult = this.currentEvalResult || {
            bestMove: null,
            score: null,
            mate: null,
            depth: 0,
            fen: pending.fen,
          };
          existingResult.bestMove = bestMove;
          pending.callback(existingResult);
          this.pendingEvals.delete(this.currentEvalId);
          this.currentEvalResult = null;
        }
        this.currentEvalId = null;
      }
      return;
    }

    // Parse info lines for evaluation
    if (msg.startsWith('info')) {
      let score: number | null = null;
      let mate: number | null = null;
      let depth = 0;

      const depthMatch = msg.match(/depth (\d+)/);
      if (depthMatch) depth = parseInt(depthMatch[1], 10);

      const mateMatch = msg.match(/score mate (-?\d+)/);
      if (mateMatch) {
        mate = parseInt(mateMatch[1], 10);
        score = mate > 0 ? 100000 : -100000;
      }

      const cpMatch = msg.match(/score cp (-?\d+)/);
      if (cpMatch) {
        score = parseInt(cpMatch[1], 10);
      }

      if (score !== null || mate !== null) {
        const pending = this.currentEvalId ? this.pendingEvals.get(this.currentEvalId) : null;
        if (pending) {
          this.currentEvalResult = {
            bestMove: null,
            score,
            mate,
            depth,
            fen: pending.fen,
          };
        }
      }
    }
  }

  private currentEvalResult: StockfishEvalResult | null = null;

  private sendEvalCommand(fen: string, depth: number, evalId: string) {
    if (!this.worker || !this.engineReady) return;
    this.currentEvalId = evalId;
    this.currentEvalResult = null;
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${depth}`);
  }

  async evaluatePosition(fen: string, depth = 12): Promise<StockfishEvalResult> {
    await this.init();

    return new Promise((resolve) => {
      const evalId = `eval_${this.evalIdCounter++}`;

      const pending = {
        fen,
        depth,
        callback: resolve,
        startTime: Date.now(),
      };

      this.pendingEvals.set(evalId, pending);

      // Timeout for evaluation
      setTimeout(() => {
        const p = this.pendingEvals.get(evalId);
        if (p) {
          const result = this.currentEvalResult || {
            bestMove: null,
            score: null,
            mate: null,
            depth: 0,
            fen,
          };
          this.pendingEvals.delete(evalId);
          this.currentEvalResult = null;
          if (this.currentEvalId === evalId) {
            this.currentEvalId = null;
            this.worker?.postMessage('stop');
          }
          resolve(result);
        }
      }, 30000);

      if (this.engineReady) {
        this.sendEvalCommand(fen, depth, evalId);
      } else {
        this.pendingCommands.push({ fen, depth, evalId, callback: resolve });
      }
    });
  }

  cancelPendingEvals() {
    if (this.currentEvalId) {
      this.pendingEvals.delete(this.currentEvalId);
      this.currentEvalId = null;
      this.currentEvalResult = null;
    }
  }

  terminate() {
    this.cancelPendingEvals();
    this.worker?.terminate();
    this.worker = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.engineReady = false;
    this.pendingCommands = [];
    this.pendingEvals.clear();
  }
}

export const stockfishManager = new StockfishManager();
