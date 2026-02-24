# Hydrosense

A full-stack water management application with a React frontend and Laravel backend.

## Structure

- `frontend/` - React application (Create React App)
- `backend/` - Laravel application with MySQL database
- `docker-compose.yml` - Docker configuration for containerized development

## Deployment & Setup Guide

**📖 For detailed instructions on Docker, local development, and Vercel deployment, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

## Quick Start (Docker Recommended)

### Prerequisites
- Docker & Docker Compose
- Node.js & npm
- Git

### Option A: One Command Setup (Easiest) ⭐

From the project root directory:

```bash
npm run dev
```

This will:
- Start Docker containers (backend + database)
- Install frontend dependencies (if needed)
- Start the React development server

### Option B: Using Scripts

**Windows PowerShell:**
```powershell
.\dev.ps1
```

**Windows Command Prompt:**
```cmd
dev.bat
```

### Option C: Manual Setup

If you prefer to start services separately:

#### 1. Start Backend with Docker

```bash
# Copy environment file (first time only)
copy backend\.env.example backend\.env

# Start Docker containers
docker-compose up -d

# Initialize database (first time only)
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate
```

Backend runs at: **http://localhost:8000**
Database at: **localhost:3307**

#### 2. Start Frontend (in a new terminal)

```bash
cd frontend
npm install  # First time only
npm start
```

Frontend runs at: **http://localhost:3000**

## Application Features

### Authentication
- **Login Page** - Secure authentication with hardcoded demo credentials
  - Email: `admin@gmail.com`
  - Password: `hydrosense`
- **Dashboard** - Protected page visible only after login
- **Logout** - Clear session and return to login page

### Pages
1. **Login Page** (`src/components/Login.js`)
   - Email and password authentication
   - Error handling for invalid credentials
   - Demo credentials displayed for easy testing

2. **Dashboard** (`src/components/Dashboard.js`)
   - Welcome message showing "officially logged in" status
   - Feature cards for Water Monitoring, Analytics, Settings, and Notifications
   - Logout button in navigation bar
   - Responsive design

## Quick Commands

### Available npm Scripts

```bash
# Development
npm run dev              # Start backend + frontend (all-in-one)
npm run backend:start    # Start Docker containers only
npm run backend:stop     # Stop Docker containers
npm run backend:logs     # View backend logs
npm run backend:migrate  # Run database migrations

# Frontend
npm run frontend:install # Install frontend dependencies
npm run frontend:start   # Start frontend dev server
npm run frontend:build   # Build frontend for production

# Deployment
npm run deploy:frontend  # Deploy frontend to Vercel
```

### Docker Commands

```bash
# View Docker container status
docker-compose ps

# View application logs
docker-compose logs app

# Stop all containers
docker-compose down

# Run Artisan commands
docker-compose exec app php artisan <command>
```

## Deployment

### Frontend to Vercel
```bash
cd frontend
vercel --prod
```

Deployed app: [hydrosense-frontend.vercel.app](https://hydrosense-frontend.vercel.app)

### Backend
For production backend deployment, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## Project Status

- ✅ Backend: Dockerized Laravel with MySQL
- ✅ Frontend: React app deployed to Vercel
- ✅ Database: MySQL container with persistent storage

## Troubleshooting

Having issues? Check [DEPLOYMENT_GUIDE.md - Troubleshooting Section](./DEPLOYMENT_GUIDE.md#troubleshooting)
