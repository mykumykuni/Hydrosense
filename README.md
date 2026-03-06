# Hydrosense

Hydrosense is a real-time water quality monitoring app for milkfish hatchery operations.

Current implementation uses:
- React frontend (`Hydrosense/frontend`)
- Vercel serverless API (`Hydrosense/api`)
- Backend state layer in a dedicated folder outside frontend (`Hydrosense/backend/database`)

## Current Live URL

- Primary domain: `https://hydrosense.app`
- Secondary domain: `https://www.hydrosense.app`

## Notes About `*.vercel.app` Names

Requested vanity subdomains like `www.hydrosenseapp.vercel.app` can only be used if that namespace belongs to your Vercel account.
Your current account can use:
- `*.vercel.app`
- `*.mykumykunis-projects.vercel.app`

## Deployment

Deploy from repository root so frontend + API ship together:

```bash
cd Hydrosense
npm run vercel:deploy
```
