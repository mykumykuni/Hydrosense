const fs = require('fs');
const path = require('path');
const { createRealtimeState } = require('./stateFactory');

const stateFilePath = path.join(__dirname, 'state.json');
const kvBaseUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const kvStateKey = 'hydrosense:state:v1';
let memoryState = null;
let memoryStateLastUpdatedAt = 0;
const MEMORY_CACHE_TTL_MS = 1 * 1000; // Refresh from KV every 1 second (was 5)

// Log KV config status once at startup
if (!kvBaseUrl || !kvToken) {
  console.warn('[STORE] ⚠️ KV_REST_API_URL and KV_REST_API_TOKEN not configured. Using memory/disk fallback only.');
  console.warn(`[STORE] KV_REST_API_URL: ${kvBaseUrl ? '✓ set' : '✗ empty'}`);
  console.warn(`[STORE] KV_REST_API_TOKEN: ${kvToken ? '✓ set' : '✗ empty'}`);
  console.warn(`[STORE] UPSTASH_REDIS_REST_URL: ${process.env.UPSTASH_REDIS_REST_URL ? '✓ set' : '✗ empty'}`);
  console.warn(`[STORE] UPSTASH_REDIS_REST_TOKEN: ${process.env.UPSTASH_REDIS_REST_TOKEN ? '✓ set' : '✗ empty'}`);
} else {
  console.log('[STORE] ✓ KV configured. Will persist state to Redis.');
}

const deepClone = (value) => JSON.parse(JSON.stringify(value));
const hasKvConfig = () => Boolean(kvBaseUrl && kvToken);

const fetchJsonSafe = async (url, options) => {
  try {
    const response = await fetch(url, options);
    console.log(`[FETCH] ${options.method} ${url.substring(0, 50)}... → ${response.status}`);
    if (!response.ok) {
      console.warn(`[FETCH] Response not OK: ${response.status} ${response.statusText}`);
      return null;
    }
    const json = await response.json();
    console.log(`[FETCH] Parsed JSON successfully`);
    return json;
  } catch (err) {
    console.error(`[FETCH] Error: ${err.message}`);
    return null;
  }
};

const readFromKv = async () => {
  if (!hasKvConfig()) {
    console.debug('[STORE:KV] readFromKv called but KV not configured - skipping');
    return null;
  }

  try {
    console.log('[STORE:KV] Reading state from Redis...');
    const data = await fetchJsonSafe(`${kvBaseUrl}/get/${encodeURIComponent(kvStateKey)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${kvToken}`
      }
    });

    if (!data) {
      console.log('[STORE:KV] No data received from Redis (new deployment?)');
      return null;
    }

    if (typeof data.result !== 'string') {
      console.warn('[STORE:KV] Redis result is not a string, got:', typeof data.result);
      return null;
    }

    try {
      const parsed = JSON.parse(data.result);
      if (parsed && typeof parsed === 'object') {
        console.log('[STORE:KV] ✓ Successfully parsed state from Redis');
        return parsed;
      }
      console.warn('[STORE:KV] Parsed Redis result is not an object');
      return null;
    } catch (parseErr) {
      console.error('[STORE:KV] Failed to parse Redis result as JSON:', parseErr.message);
      return null;
    }
  } catch (err) {
    console.error('[STORE:KV] Read exception:', err.message);
    return null;
  }
};

const writeToKv = async (state) => {
  if (!hasKvConfig()) {
    console.warn('[STORE:KV] ⚠️ writeToKv called but KV not configured - skipping');
    return false;
  }

  try {
    const stateJson = JSON.stringify(state);
    const stateSize = stateJson.length;
    console.log(`[STORE:KV] Attempting to persist ${stateSize} bytes to Redis...`);
    
    // POST to /set/{key} endpoint with the JSON as request body
    // Upstash will store it as a string value
    const data = await fetchJsonSafe(`${kvBaseUrl}/set/${encodeURIComponent(kvStateKey)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: stateJson
    });

    if (data && (data.result === 'OK' || data === 'OK')) {
      console.log('[STORE:KV] ✓ State persisted to Redis successfully');
      return true;
    } else {
      const responseStr = data ? JSON.stringify(data).substring(0, 300) : 'null';
      console.error('[STORE:KV] ✗ Redis write failed. Response:', responseStr);
      if (data && (data.error || data.message)) {
        console.error('[STORE:KV] Error:', data.error || data.message);
      }
      return false;
    }
  } catch (err) {
    console.error('[STORE:KV] ✗ Write exception:', err.message);
    return false;
  }
};

const readFromDisk = () => {
  try {
    if (!fs.existsSync(stateFilePath)) return null;
    const raw = fs.readFileSync(stateFilePath, 'utf8');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeToDisk = (state) => {
  try {
    fs.mkdirSync(path.dirname(stateFilePath), { recursive: true });
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Vercel serverless filesystem is read-only; memory fallback handles runtime state.
  }
};

const getState = async () => {
  const now = Date.now();
  
  // Use memory cache if it's recent enough (within TTL)
  if (memoryState && (now - memoryStateLastUpdatedAt) < MEMORY_CACHE_TTL_MS) {
    console.log(`[STORE] getState: Using cached memoryState (age: ${now - memoryStateLastUpdatedAt}ms)`);
    return deepClone(memoryState);
  }

  // Cache expired or doesn't exist - refresh from KV
  console.log('[STORE] getState: Memory cache expired or missing, refreshing from KV...');
  const kvState = await readFromKv();
  if (kvState) {
    memoryState = kvState;
    memoryStateLastUpdatedAt = now;
    console.log('[STORE] getState: ✓ Loaded fresh state from KV, updated memory cache');
    return deepClone(memoryState);
  }

  // Fall back to disk if KV is empty
  console.log('[STORE] getState: KV miss, trying disk...');
  const diskState = readFromDisk();
  if (diskState) {
    memoryState = diskState;
    memoryStateLastUpdatedAt = now;
    console.log('[STORE] getState: ✓ Loaded from disk, caching in memory');
    return deepClone(memoryState);
  }

  // No persistent state, create fresh
  console.log('[STORE] getState: No persistent state found, creating fresh state');
  memoryState = createRealtimeState();
  memoryStateLastUpdatedAt = now;
  writeToDisk(memoryState);
  return deepClone(memoryState);
};

const invalidateCache = () => {
  console.log('[STORE] invalidateCache: Clearing memory cache to force KV refresh');
  memoryStateLastUpdatedAt = 0;
};

const saveState = async (nextState) => {
  const userCount = (nextState.users || []).length;
  const operatorCount = (nextState.users || []).filter(u => u.role === 'operator').length;
  console.log(`[STORE] saveState: Persisting state (${userCount} users, ${operatorCount} operators)`);
  
  memoryState = deepClone(nextState);
  memoryStateLastUpdatedAt = Date.now(); // Reset TTL - we just got fresh data
  
  // Try KV first
  const kvSuccess = await writeToKv(memoryState);
  
  // Always also write to disk as backup
  writeToDisk(memoryState);
  
  if (!kvSuccess) {
    console.warn('[STORE] saveState: KV write failed or skipped - only using memory/disk cache. State may not persist across instances!');
  }
  
  return deepClone(memoryState);
};

module.exports = {
  getState,
  saveState,
  invalidateCache
};
