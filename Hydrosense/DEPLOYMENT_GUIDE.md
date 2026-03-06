# Hydrosense - Deployment and Development Guide

This guide reflects the current architecture:
- React frontend (`Hydrosense/frontend`)
- Vercel serverless API routes (`/api/*` wrappers at repo root, handlers in `Hydrosense/api`)
- Backend state/auth engine in `Hydrosense/backend/database`

## Prerequisites

- Node.js 20+ and npm
- Git
- Vercel CLI (`npm install -g vercel`)
- Vercel account

## Repository Layout

- Workspace root: `C:\Windows\System32\Hydrosense`
- App root: `C:\Windows\System32\Hydrosense\Hydrosense`
- Frontend source: `Hydrosense/frontend`
- API handlers: `Hydrosense/api`
- API entrypoints for Vercel: `api`

## Local Development

Run from app root:

```bash
cd C:\Windows\System32\Hydrosense\Hydrosense
npm install
npm run dev
```

This starts the React dev server at:
- `http://localhost:3000`

Notes:
- API calls use same-origin `/api/*` paths.
- Legacy Docker/Laravel backend flow is no longer the active runtime path.

## Frontend Build

Build from workspace root (same flow used by Vercel root deployment):

```bash
cd C:\Windows\System32\Hydrosense
npm run vercel-build
```

## Deployment (Vercel)

Always deploy from workspace root:

```bash
cd C:\Windows\System32\Hydrosense
npm run vercel:link
npm run vercel:deploy
```

Expected Vercel settings (root deployment):
- Build command: `npm run vercel-build`
- Output directory: `Hydrosense/frontend/build`

## API Endpoints

- `POST /api/auth` (`action: register | login`)
- `GET /api/state`
- `POST /api/state`
- `GET /api/profile`
- `PATCH /api/profile`
- `GET /api/operators`
- `POST /api/operators`

## Admin Seed Credential

Default seeded admin credential (if no admin exists):
- Email: `admin.hydrosense@gmail.com`
- Password: `admin@123`

Override with environment variables:
- `HYDROSENSE_ADMIN_EMAIL`
- `HYDROSENSE_ADMIN_PASSWORD`

## Optional Environment Variables

Frontend (`Hydrosense/frontend/.env.local`):
- `REACT_APP_API_BASE=`

Keep blank to use same-origin API routes.

Persistence (Vercel KV optional):
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## Troubleshooting

### `npm run dev` starts but shows CRA deprecation warnings
These warnings come from `react-scripts`/webpack-dev-server internals and do not block local development.

### `No Output Directory named "build" found`
Ensure deployment is from workspace root and `vercel.json` contains:
- `outputDirectory: Hydrosense/frontend/build`

### Login/Register shows network error
Confirm `/api/auth` exists in deployed project and deployment includes root `api/` wrappers.

### `npm audit fix` says lockfile missing
Run `npm audit fix` inside a folder that has a lockfile:
- `C:\Windows\System32\Hydrosense\Hydrosense`
- or `C:\Windows\System32\Hydrosense\Hydrosense\frontend`
