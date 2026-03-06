# Hydrosense

Hydrosense is currently a frontend-only project.

## Why There Is No Backend

The previous backend implementation was removed on purpose because it was unstable and repeatedly failing to boot in Docker.
To avoid blocking frontend progress and reduce maintenance overhead, the backend folder was deleted until a clean, verified backend can be rebuilt later.

## Current Structure

- `frontend/` - React application
- `docker-compose.yml` - kept in repository, but backend services are currently not active

## Frontend Development

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

## Status

- Backend: intentionally removed
- Frontend: active
