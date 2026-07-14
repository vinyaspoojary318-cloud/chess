/**
 * Stockfish Web Worker (Classic)
 * 
 * This worker is loaded with a hash in the URL (e.g., /stockfish.worker.js#worker,worker)
 * so that stockfish.js can detect it's running in a worker context.
 * 
 * stockfish.js checks: self.location.hash.split(",")[1] === "worker"
 * Our URL hash: #worker,worker → split(",")[1] === "worker" ✓
 */

importScripts('/stockfish.js');

// If auto-detection worked (hash matched), stockfish.js will have set up its own
// onmessage handler and will communicate via postMessage automatically.
// 
// Fallback: if Stockfish is a global function (non-auto-detection path),
// create the engine and set up communication manually.
if (typeof Stockfish === 'function') {
  var engine = Stockfish();
  engine.onmessage = function(msg) {
    postMessage(msg);
  };
  onmessage = function(e) {
    engine.postMessage(e.data);
  };
}
