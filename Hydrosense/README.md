# Hydrosense

This repository contains a React frontend and a Laravel backend.

## Structure

- `frontend/` - created with Create React App.
- `backend/` - Laravel application created via Composer.

## Getting Started

### Backend (Laravel)

```bash
cd backend
composer install        # install PHP dependencies
cp .env.example .env    # set up environment
php artisan key:generate
php artisan migrate      # run migrations if any
php artisan serve        # start Laravel development server (usually on http://127.0.0.1:8000)
```

### Frontend (React)

```bash
cd frontend
npm install             # install JS dependencies
npm start               # start development server (http://localhost:3000)
```

### Notes

Adjust ports, database settings, and environment variables as needed. You can configure cross-origin access or proxies for local development.
