# Hydrosense Frontend

React client for Hydrosense live monitoring and operations dashboard.

## Run Locally

```bash
cd frontend
npm install
npm start
```

- App URL: `http://localhost:3000`

## Build

From repo root:

```bash
npm run vercel-build
```

From frontend folder:

```bash
npm run build
```

## Realtime Data Model

Frontend does not generate the source-of-truth data anymore.
It reads/writes shared state through backend API:

- `GET /api/state` - fetch latest shared state
- `POST /api/state` - apply mutations/actions

### Shared Across Roles

- Sensor values
- Thresholds
- Alert log and read/resolved status
- History window size

### Role Rules

- `admin`: can update thresholds/history and perform admin alert actions
- `operator`: read-focused, can mark/read/report issue actions allowed by backend

## Optional Environment Variable

`frontend/.env.local`:

```bash
REACT_APP_API_BASE=
```

Leave empty for same-origin API (`/api/state`).

## Dashboard Routes

- `/dashboard/live`
- `/dashboard/operations`
- `/dashboard/alerts`

Main orchestrator: `src/pages/Dashboard.js`

## Deployment

Deploy from repository root so frontend + root API are included:

```bash
npm run vercel:deploy
```

## Production Domains

- `https://hydrosense.app`
- `https://www.hydrosense.app`

Custom `*.vercel.app` aliases are restricted to namespaces owned by your Vercel account.
