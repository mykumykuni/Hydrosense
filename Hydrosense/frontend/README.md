# Hydrosense Frontend

This folder contains the React frontend for Hydrosense water quality monitoring.

## Quick Start

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`.

Production build:

```bash
npm run build
```

## Dashboard Routing

The dashboard is split into route-based pages:

- `/dashboard/live` - live summary + sensor cards
- `/dashboard/operations` - role-specific operations panels
- `/dashboard/alerts` - alert feed page

`/dashboard/*` is handled by `src/pages/Dashboard.js`.

## Role Behavior

Role is inferred at login and stored in local storage key `hydrosenseRole`.

- Email contains `admin` -> `admin`
- Otherwise -> `operator`

### Operator

- Can monitor live sensors and summaries
- Can view alerts and mark read/unread
- Can mark all alerts as read
- Can report issue to admin
- Cannot edit thresholds, export alerts, clear all alerts, or resolve alerts

### Admin

- Has all operator visibility
- Can create manual alerts
- Can clear all alerts
- Can resolve alerts
- Can export alerts to CSV
- Can edit per-sensor min/max thresholds in Admin Threshold Manager

## Realtime Sync (Admin and Operator)

Sensor values, thresholds, alert states, and history window are now shared realtime.

- Default mode: local shared sync (same browser/device tabs)
- Supabase mode: cross-device realtime sync (admin and operator on different devices)

To enable cross-device sync, create `frontend/.env` from `frontend/.env.example` and set:

```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Without those env vars, the app still runs using local shared mode.

## Dashboard Code Structure

Main container/orchestrator:

- `src/pages/Dashboard.js`

Extracted dashboard modules:

- `src/pages/dashboard/AlertModal.js`
- `src/pages/dashboard/sections/SummarySection.js`
- `src/pages/dashboard/sections/SensorsSection.js`
- `src/pages/dashboard/sections/WaterLevelSection.js`
- `src/pages/dashboard/sections/OperationsSectionAdmin.js`
- `src/pages/dashboard/sections/OperationsSectionOperator.js`
- `src/pages/dashboard/sections/AlertsPageSection.js`

## UI and Assets

- Dashboard logo: `public/adjusted.png`
- Login/Register logo: `public/adjusted dd.png`
- Favicon/App icon references are configured in:
	- `public/index.html`
	- `public/manifest.json`

If browser tab icon appears stale, hard refresh (`Ctrl+F5`) or reopen tab.

## Deployment Notes (Vercel)

The repo supports either root-level deploy config or frontend-root deploy config:

- Root config: `vercel.json`
- Frontend config: `frontend/vercel.json`

Use the config matching your Vercel project's Root Directory setting.

## Foolproof Deploy Flow

Use these commands from repository root (`Hydrosense/`) so deploy behavior stays consistent:

```bash
npm run vercel:link
npm run vercel:deploy
```

This always deploys from `frontend/` using `--cwd frontend`.

Extra safeguards in this repo:

- Node runtime constrained to `>=20 <25` in both `package.json` files
- Vercel build path uses explicit `vercel-build` scripts (`npm install` + build)
- Frontend build command is `npm run vercel-build`
