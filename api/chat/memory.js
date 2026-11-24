'use strict';

// Public visitor chat memory is deliberately transient and per-process.
// Persistent transcript storage is disabled until explicit consent and retention controls are implemented.
const MAX_TURNS = 10;
const TTL_MS = 1000 * 60 * 30;
const sessions = new Map();

function getSessionHistory(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return [];
  if (Date.now() - session.updatedAt > TTL_MS) {
    sessions.delete(sessionId);
    return [];
  }
  session.updatedAt = Date.now();
  return session.turns.slice(-MAX_TURNS);
}

function appendTurn(sessionId, role, content) {
  const session = sessions.get(sessionId) || { turns: [], updatedAt: Date.now() };
  session.turns.push({ role, content: String(content).slice(0, 7000) });
  session.turns = session.turns.slice(-MAX_TURNS);
  session.updatedAt = Date.now();
  sessions.set(sessionId, session);
}

function prune() {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, session] of sessions) {
    if (session.updatedAt < cutoff) sessions.delete(id);
  }
}
setInterval(prune, 5 * 60 * 1000).unref();

module.exports = { getSessionHistory, appendTurn, _memoryCache: sessions };
