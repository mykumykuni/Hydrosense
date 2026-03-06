# Hydrosense Frontend

React client for Hydrosense live monitoring and operations dashboard.

## Run Locally

```bash
cd Hydrosense
npm install
npm run dev
```

Or run frontend directly:

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
- `POST /api/auth` - register/login
- `GET/PATCH /api/profile` - operator profile retrieval/update
- `GET/POST /api/operators` - admin operator management

## Authentication and Access

- Login is backend-validated (`POST /api/auth`, action `login`)
- Registration is backend-validated (`POST /api/auth`, action `register`)
- Operator login requires admin approval
- Dashboard routes are protected by session token in local storage

Default seeded admin account:
- `admin.hydrosense@gmail.com`
- `admin@123`

Override admin seed (set on backend environment):
- `HYDROSENSE_ADMIN_EMAIL`
- `HYDROSENSE_ADMIN_PASSWORD`

### Shared Across Roles

- Sensor values
- Thresholds
- Alert log and read/resolved status
- History window size

### Role Rules

- `admin`: can update thresholds/history and perform admin alert actions
- `operator`: read-focused, can mark/read/report issue actions allowed by backend

## Profile and Operator Management

- Operator page: `/dashboard/profile`
	- Edit display name, phone, address, bio, position, emergency contact
	- Upload photo (stored as base64 in backend state)
- Admin page: `/dashboard/operators`
	- View all operators and pending registrations
	- Search by name/email
	- Approve, deactivate, and reactivate operators

## Optional Environment Variable

`frontend/.env.local`:

```bash
REACT_APP_API_BASE=
```

Leave empty for same-origin API (`/api/state`).

For most local and production setups, keep `REACT_APP_API_BASE` empty so requests use same-origin `/api/*` routes.

## Dashboard Routes

- `/dashboard/live`
- `/dashboard/operations`
- `/dashboard/alerts`

Main orchestrator: `src/pages/Dashboard.js`

## Deployment

Deploy from repository root so frontend + root API are included:

```bash
cd C:\Windows\System32\Hydrosense
npm run vercel:deploy
```

## Production Domains

- `https://hydrosense.app`
- `https://www.hydrosense.app`

Custom `*.vercel.app` aliases are restricted to namespaces owned by your Vercel account.
