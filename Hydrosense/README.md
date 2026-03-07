# Hydrosense

Hydrosense runs a React frontend with a Vercel serverless backend API for shared real-time state.

## Architecture

- `frontend/` - React client UI
- Root `api/` wrappers - Vercel function entrypoints
- `Hydrosense/api/*.js` - API handler implementations
- `backend/database/` - backend data/state engine and persistence modules

The database/state folder is intentionally outside `frontend/`.

### Frontend Component Structure

The dashboard was refactored into a component-based structure to improve maintainability and reuse:

- Composition root: `frontend/src/pages/Dashboard.js`
- Data hooks:
  - `frontend/src/hooks/useDashboardData.js`
  - `frontend/src/hooks/useProfileAndOperators.js`
- Shared API helper: `frontend/src/utils/apiClient.js`
- Monitoring constants: `frontend/src/constants/monitoring.js`
- Layout components:
  - `frontend/src/pages/dashboard/DashboardSidebar.js`
  - `frontend/src/pages/dashboard/DashboardTopbar.js`
  - `frontend/src/pages/dashboard/DashboardMobileTabs.js`

## Features

- Shared sensor state across admin/operator via backend API
- Admin-only control actions enforced server-side
- Shared alerts and history window controls
- Real-time simulation and alerts generated in backend engine
- Backend-enforced authentication with hashed passwords and session tokens
- Operator registration requires admin approval before login
- Operator profile management (photo + details) and admin operator moderation

## Persistence

Primary persistence (recommended):
- Vercel KV via environment variables:
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`

Fallback persistence:
- In-memory state in function runtime
- Local JSON seed/fallback at `backend/database/state.json`

## Local Development

Start local development:

```bash
cd Hydrosense
npm install
npm run dev
```

- App URL: `http://localhost:3000`
- API base: same-origin (`/api/*`)

Legacy Docker/Laravel scripts are retained only as placeholders and are not part of the active Vercel API architecture.

Build from repo root:

```bash
npm run vercel-build
```

## Deployment

Always deploy from repository root so both frontend output and API functions are included:

```bash
cd C:\Users\Myku\Capstone\Hydrosense
npm run vercel:link
npm run vercel:deploy
```

Project settings for Vercel root deployment:
- Build command: `npm run vercel-build`
- Output directory: `Hydrosense/frontend/build`

## Domains

Primary live domain:
- `https://hydrosense.app`

Also configured:
- `https://www.hydrosense.app`

Note: custom `*.vercel.app` aliases are limited to namespaces owned by your Vercel account.

## Auth/API Endpoints

- `POST /api/auth` with `action: register | login`
- `GET /api/profile` (authenticated)
- `PATCH /api/profile` (authenticated operator only)
- `GET /api/operators` (authenticated admin only)
- `POST /api/operators` actions: `approve_operator`, `deactivate_operator`, `reactivate_operator`

Default seeded admin credentials:
- Email: `admin.hydrosense@gmail.com`
- Password: `admin@123`

Override admin seed via environment variables:
- `HYDROSENSE_ADMIN_EMAIL`
- `HYDROSENSE_ADMIN_PASSWORD`
