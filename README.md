# Hydrosense

Hydrosense is a real-time water quality monitoring app for milkfish hatchery operations.

Current implementation uses:
- React frontend (`Hydrosense/frontend`)
- Vercel serverless API (`api/` wrappers -> `Hydrosense/api` handlers)
- Backend state layer in a dedicated folder outside frontend (`Hydrosense/backend/database`)

## Local Development

Use the app package for local frontend development:

```bash
cd Hydrosense
npm install
npm run dev
```

- Local app URL: `http://localhost:3000`
- API calls use same-origin routes (`/api/*`)

Note: Legacy Docker/Laravel backend flow is no longer the active architecture for this project.

Build from workspace root (same command Vercel uses):

```bash
npm run vercel-build
```

## Current Live URLs

- Production: `https://hydrosense-omega.vercel.app`
- Branch (main): `https://frontend-git-main-mykumykunis-projects.vercel.app`
- Preview: `https://frontend-ni7vbh6py-mykumykunis-projects.vercel.app`

## Deployment

Deploy from repository root so frontend + API ship together:

```bash
cd C:\Users\Myku\Capstone\Hydrosense
npm run vercel:link
npm run vercel:deploy
```

## Default Admin Seed

Default seeded admin account:
- Email: `admin.hydrosense@gmail.com`
- Password: `admin@123`

You can override these with environment variables:
- `HYDROSENSE_ADMIN_EMAIL`
- `HYDROSENSE_ADMIN_PASSWORD`
