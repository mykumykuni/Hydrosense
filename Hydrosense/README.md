# Hydrosense

Hydrosense runs a React frontend plus a Vercel serverless backend API.

## Project Structure

- `frontend/` - React client
- `api/` - Vercel serverless functions (`/api/state`)
- `backend/database/` - backend data/state modules and seed file

The database/state layer is intentionally outside `frontend/` to keep backend concerns separated.

## Local Development

Frontend:

```bash
cd frontend
npm install
npm start
```

Production build from repo root:

```bash
npm run vercel-build
```

## Deployment

Deploy from repository root so both frontend output and API routes are included:

```bash
npm run vercel:deploy
```

## Persistent Backend State (Vercel)

For persistent cross-instance state, configure Vercel KV environment variables
on the `frontend` project:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

If KV is not configured, backend state falls back to in-memory plus local file
(`backend/database/state.json`).
