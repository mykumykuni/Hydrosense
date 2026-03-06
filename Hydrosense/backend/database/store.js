const fs = require('fs');
const path = require('path');
const { createRealtimeState } = require('./stateFactory');

const stateFilePath = path.join(process.cwd(), 'backend', 'database', 'state.json');
const kvBaseUrl = process.env.KV_REST_API_URL || '';
const kvToken = process.env.KV_REST_API_TOKEN || '';
const kvStateKey = 'hydrosense:state:v1';
let memoryState = null;

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
  if (!hasKvConfig()) return null;

  const data = await fetchJsonSafe(`${kvBaseUrl}/get/${encodeURIComponent(kvStateKey)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${kvToken}`
    }
  });

  if (!data || typeof data.result !== 'string') return null;

  try {
    const parsed = JSON.parse(data.result);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeToKv = async (state) => {
  if (!hasKvConfig()) return false;

  const data = await fetchJsonSafe(`${kvBaseUrl}/set/${encodeURIComponent(kvStateKey)}/${encodeURIComponent(JSON.stringify(state))}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${kvToken}`
    }
  });

  return Boolean(data && data.result === 'OK');
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
  if (memoryState) return deepClone(memoryState);

  const kvState = await readFromKv();
  if (kvState) {
    memoryState = kvState;
    return deepClone(memoryState);
  }

  const diskState = readFromDisk();
  if (diskState) {
    memoryState = diskState;
    return deepClone(memoryState);
  }

  memoryState = createRealtimeState();
  writeToDisk(memoryState);
  return deepClone(memoryState);
};

const saveState = async (nextState) => {
  memoryState = deepClone(nextState);
  await writeToKv(memoryState);
  writeToDisk(memoryState);
  return deepClone(memoryState);
};

module.exports = {
  getState,
  saveState
};
