type EvalCallback = (result: StockfishEvalResult) => void;

export interface StockfishEvalResult {
  bestMove: string | null;
  score: number | null; // in centipawns
  mate: number | null;
  depth: number;
  fen: string;
}

interface StockfishWorker {
  postMessage(message: string): void;
  onmessage: ((e: { data: string }) => void) | null;
  onerror: ((err: any) => void) | null;
  terminate(): void;
}

class StockfishManager {
  private worker: StockfishWorker | null = null;
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
      (async () => {
        try {
          let readyTimeout: ReturnType<typeof setTimeout>;

        const handleMessage = (msg: string) => {
          if (typeof msg !== 'string') return;

          // Check for engine initialization messages
          if (msg.startsWith('uciok') || msg.startsWith('readyok')) {
            if (!this.engineReady) {
              this.engineReady = true;
              clearTimeout(readyTimeout);
              this.isInitialized = true;
              resolve();

              // Process any pending evaluations
              for (const pending of this.pendingCommands) {
                this.sendEvalCommand(pending.fen, pending.depth, pending.evalId);
              }
              this.pendingCommands = [];
            }
            return;
          }

          // Handle engine output
          this.handleEngineOutput(msg);
        };

        if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
          // Browser environment
          const workerUrl = '/stockfish.worker.js#worker,worker';
          const nativeWorker = new Worker(workerUrl, { type: 'classic' });
          const workerWrapper: StockfishWorker = {
            postMessage: (msg: string) => nativeWorker.postMessage(msg),
            onmessage: null,
            onerror: null,
            terminate: () => nativeWorker.terminate(),
          };
          nativeWorker.onmessage = (e: MessageEvent) => {
            if (workerWrapper.onmessage) workerWrapper.onmessage({ data: e.data });
          };
          nativeWorker.onerror = (err) => {
            if (workerWrapper.onerror) workerWrapper.onerror(err);
          };
          this.worker = workerWrapper;
        } else {
          // Node.js environment
          const getReq = new Function('return typeof require !== "undefined" ? require : null');
          const req = getReq();
          if (!req) {
            throw new Error('Stockfish engine is not supported in this environment');
          }
          const stockfishInit = req('stockfish');
          const engineRes = typeof stockfishInit === 'function' ? stockfishInit() : stockfishInit;
          const engine = (engineRes && typeof engineRes.then === 'function') ? await engineRes : engineRes;

          const workerWrapper: StockfishWorker = {
            onmessage: null,
            onerror: null,
            postMessage: (cmd: string) => {
              if (typeof engine.postMessage === 'function') {
                engine.postMessage(cmd);
              } else if (typeof engine.sendCommand === 'function') {
                engine.sendCommand(cmd);
              }
            },
            terminate: () => {
              if (typeof engine.terminate === 'function') {
                engine.terminate();
              }
            }
          };

          engine.listener = (msg: string) => {
            if (workerWrapper.onmessage) {
              workerWrapper.onmessage({ data: msg });
            }
          };
          if (typeof engine.onmessage === 'function') {
            const origOnMessage = engine.onmessage;
            engine.onmessage = (e: any) => {
              const strData = typeof e === 'string' ? e : e?.data;
              if (workerWrapper.onmessage) workerWrapper.onmessage({ data: strData });
              if (origOnMessage && origOnMessage !== engine.onmessage) origOnMessage(e);
            };
          }

          this.worker = workerWrapper;
        }

        this.worker.onmessage = (e) => handleMessage(e.data);
        this.worker.onerror = (err) => {
          console.error('Stockfish worker error:', err);
          clearTimeout(readyTimeout);
          if (!this.isInitialized) {
            reject(new Error('Stockfish worker failed to initialize'));
          }
        };

        this.worker.postMessage('uci');
        this.worker.postMessage('isready');

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
    })();
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
