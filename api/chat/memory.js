'use strict';

// Public website chat intentionally uses transient in-process memory only. Do not persist visitor transcripts until consent/retention policy is implemented.

const MAX_TURNS = 10;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const memoryCache = new Map();
let mongoClientPromise = null;

async function getCollection() {
  const uri = String(process.env.MONGODB_URI || '').trim();
  if (!uri) return null;
  if (!mongoClientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2500, maxPoolSize: 5 });
    mongoClientPromise = client.connect().then(() => client).catch(error => {
      mongoClientPromise = null;
      throw error;
    });
  }
  const client = await mongoClientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || 'bookmyrecords');
  const collection = db.collection('chatbot_sessions');
  await collection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 0 });
  await collection.createIndex({ sessionId: 1 }, { unique: true });
  return collection;
}

async function getSessionHistory(sessionId) {
  const now = Date.now();
  const local = memoryCache.get(sessionId);
  if (local && now - local.updatedAt < SESSION_TTL_MS) return local.turns.slice(-MAX_TURNS);
  if (local) memoryCache.delete(sessionId);

  const collection = await getCollection().catch(() => null);
  if (!collection) return [];
  const record = await collection.findOne({ sessionId }, { projection: { turns: 1, updatedAt: 1 } });
  if (!record || !Array.isArray(record.turns)) return [];
  const turns = record.turns.slice(-MAX_TURNS);
  memoryCache.set(sessionId, { turns, updatedAt: now });
  return turns;
}

async function appendTurn(sessionId, role, content) {
  const now = new Date();
  const existing = memoryCache.get(sessionId) || { turns: [], updatedAt: now.getTime() };
  const turns = [...existing.turns, { role, content: String(content).slice(0, 7000), at: now.toISOString() }].slice(-MAX_TURNS);
  memoryCache.set(sessionId, { turns, updatedAt: now.getTime() });

  const collection = await getCollection().catch(() => null);
  if (!collection) return;
  await collection.updateOne(
    { sessionId },
    { $set: { sessionId, turns, updatedAt: now } },
    { upsert: true }
  );
}

function pruneMemoryCache() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [key, value] of memoryCache.entries()) {
    if (value.updatedAt < cutoff) memoryCache.delete(key);
  }
}
setInterval(pruneMemoryCache, 15 * 60 * 1000).unref();

module.exports = { getSessionHistory, appendTurn, _memoryCache: memoryCache };
