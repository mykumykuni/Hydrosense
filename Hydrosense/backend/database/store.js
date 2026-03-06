const fs = require('fs');
const path = require('path');
const { createRealtimeState } = require('./stateFactory');

const stateFilePath = path.join(__dirname, 'state.json');
const kvBaseUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const kvStateKey = 'hydrosense:state:v1';
let memoryState = null;

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
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const readFromKv = async () => {
  if (!hasKvConfig()) {
    console.debug('[STORE:KV] readFromKv called but KV not configured - skipping');
    return null;
  }

  try {
    console.log('[STORE:KV] Reading state from KV...');
    const data = await fetchJsonSafe(`${kvBaseUrl}/get/${encodeURIComponent(kvStateKey)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${kvToken}`
      }
    });

    if (!data) {
      console.log('[STORE:KV] No KV response received (may be first-time deploy)');
      return null;
    }

    if (typeof data.result !== 'string') {
      console.warn('[STORE:KV] KV result is not a string:', typeof data.result);
      return null;
    }

    try {
      const parsed = JSON.parse(data.result);
      if (parsed && typeof parsed === 'object') {
        console.log('[STORE:KV] ✓ Read successful, loaded state');
        return parsed;
      }
      console.warn('[STORE:KV] Parsed KV result is not an object');
      return null;
    } catch (parseErr) {
      console.error('[STORE:KV] Failed to parse KV result:', parseErr.message);
      return null;
    }
  } catch (err) {
    console.error('[STORE:KV] Read failed:', err.message);
    return null;
  }
};

const writeToKv = async (state) => {
  if (!hasKvConfig()) {
    console.warn('[STORE:KV] ⚠️ writeToKv called but KV not configured - skipping');
    return false;
  }

  try {
    const stateSize = JSON.stringify(state).length;
    console.log(`[STORE:KV] Writing state (${stateSize} bytes) to KV...`);
    
    // Use POST body to avoid URL-length issues when state payload grows.
    const data = await fetchJsonSafe(`${kvBaseUrl}/set/${encodeURIComponent(kvStateKey)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(state)
    });

    if (data && data.result === 'OK') {
      console.log('[STORE:KV] ✓ Write successful');
      return true;
    } else {
      console.warn('[STORE:KV] ✗ Write returned unexpected response:', data);
      return false;
    }
  } catch (err) {
    console.error('[STORE:KV] ✗ Write failed:', err.message);
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
  // If we have cached state in memory for this instance, use it
  if (memoryState) {
    console.log('[STORE] getState: Using cached memoryState (in-memory)');
    return deepClone(memoryState);
  }

  // Try KV first
  console.log('[STORE] getState: No cache, trying KV...');
  const kvState = await readFromKv();
  if (kvState) {
    memoryState = kvState;
    console.log('[STORE] getState: ✓ Loaded from KV, caching in memory');
    return deepClone(memoryState);
  }

  // Fall back to disk
  console.log('[STORE] getState: KV miss, trying disk...');
  const diskState = readFromDisk();
  if (diskState) {
    memoryState = diskState;
    console.log('[STORE] getState: ✓ Loaded from disk, caching in memory');
    return deepClone(memoryState);
  }

  // No persistent state, create fresh
  console.log('[STORE] getState: No persistent state found, creating fresh state');
  memoryState = createRealtimeState();
  writeToDisk(memoryState);
  return deepClone(memoryState);
};

const saveState = async (nextState) => {
  const userCount = (nextState.users || []).length;
  const operatorCount = (nextState.users || []).filter(u => u.role === 'operator').length;
  console.log(`[STORE] saveState: Persisting state (${userCount} users, ${operatorCount} operators)`);
  
  memoryState = deepClone(nextState);
  
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
  saveState
};
