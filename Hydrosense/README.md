# Hydrosense

Hydrosense runs a React frontend with a Vercel serverless backend API for shared real-time state.

## Architecture

- `frontend/` - React client UI
- `api/state.js` - Vercel serverless API endpoint (`GET/POST /api/state`)
- `backend/database/` - backend data/state engine and persistence modules

The database/state folder is intentionally outside `frontend/`.

## Features

- Shared sensor state across admin/operator via backend API
- Admin-only control actions enforced server-side
- Shared alerts and history window controls
- Real-time simulation and alerts generated in backend engine

## Persistence

Primary persistence (recommended):
- Vercel KV via environment variables:
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`

Fallback persistence:
- In-memory state in function runtime
- Local JSON seed/fallback at `backend/database/state.json`

## Local Development

Frontend:

```bash
cd frontend
npm install
npm start
```

Build from repo root:

```bash
npm run vercel-build
```

## Deployment

Always deploy from repository root so both frontend output and API functions are included:

```bash
npm run vercel:link
npm run vercel:deploy
```

## Domains

Primary live domain:
- `https://hydrosense.app`

Also configured:
- `https://www.hydrosense.app`

Note: custom `*.vercel.app` aliases are limited to namespaces owned by your Vercel account.
