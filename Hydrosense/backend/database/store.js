const fs = require('fs');
const path = require('path');
const { createRealtimeState } = require('./stateFactory');

const stateFilePath = path.join(process.cwd(), 'backend', 'database', 'state.json');
let memoryState = null;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

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

const getState = () => {
  if (memoryState) return deepClone(memoryState);

  const diskState = readFromDisk();
  if (diskState) {
    memoryState = diskState;
    return deepClone(memoryState);
  }

  memoryState = createRealtimeState();
  writeToDisk(memoryState);
  return deepClone(memoryState);
};

const saveState = (nextState) => {
  memoryState = deepClone(nextState);
  writeToDisk(memoryState);
  return deepClone(memoryState);
};

module.exports = {
  getState,
  saveState
};
