const fs = require('fs');
const path = require('path');
const { createRealtimeState } = require('./stateFactory');

const stateFilePath = path.join(__dirname, 'state.json');
const kvBaseUrl = String(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const kvStateKey = 'hydrosense:state:v1';

const hasKv = () => Boolean(kvBaseUrl && kvToken);

// Read state from Upstash Redis via REST API.
// The GET /get/{key} endpoint returns { result: "<json-string>" }.
const readFromKv = async () => {
  if (!hasKv()) return null;
  try {
    const res = await fetch(`${kvBaseUrl}/get/${encodeURIComponent(kvStateKey)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.result !== 'string') return null;
    const parsed = JSON.parse(data.result);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

// Write state to Upstash Redis using the pipeline endpoint.
// pipeline POST sends [ ["SET", key, value] ] and Upstash stores value as a plain string.
// This avoids ambiguity with the /set/{key} POST endpoint and Content-Type interpretation.
const writeToKv = async (state) => {
  if (!hasKv()) return false;
  try {
    const stateJson = JSON.stringify(state);
    const res = await fetch(`${kvBaseUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([['SET', kvStateKey, stateJson]])
    });
    if (!res.ok) return false;
    const data = await res.json();
    // Pipeline returns an array of results: [ { result: "OK" } ]
    return Array.isArray(data) && data[0]?.result === 'OK';
  } catch {
    return false;
  }
};

const readFromDisk = () => {
  try {
    if (!fs.existsSync(stateFilePath)) return null;
    const raw = fs.readFileSync(stateFilePath, 'utf8');
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
    // Vercel serverless filesystem is read-only in production — ignore.
  }
};

// Always reads the latest state from KV so every request gets a fresh, consistent view.
// No memory caching — stale cached state was the source of race-condition overwrites.
const getState = async () => {
  const kvState = await readFromKv();
  if (kvState) return kvState;

  const diskState = readFromDisk();
  if (diskState) return diskState;

  return createRealtimeState();
};

// Persists mutated state to KV (and disk as local-dev fallback).
// Only call this after a real mutation — never on read-only paths.
const saveState = async (state) => {
  const kvOk = await writeToKv(state);
  if (!kvOk && hasKv()) {
    console.warn('[STORE] KV write failed — state change may not persist across instances');
  }
  writeToDisk(state);
  return state;
};

module.exports = { getState, saveState };
