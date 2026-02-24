# Hydrosense - Deployment & Development Guide

This guide explains how to set up and deploy the Hydrosense application using Docker for the backend and Vercel for the frontend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Setup](#docker-setup)
4. [Frontend Development](#frontend-development)
5. [Vercel Deployment](#vercel-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Docker & Docker Compose**: https://www.docker.com/products/docker-desktop
- **Node.js & npm**: https://nodejs.org/ (v16 or higher)
- **Git**: https://git-scm.com/
- **Vercel CLI**: Install globally with `npm install -g vercel`
- **Vercel Account**: https://vercel.com/signup

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hydrosense
```

### 2. Create Backend Environment File

Copy the example environment file:

```bash
copy backend\.env.example backend\.env
```

The `.env` file contains database configuration. Key settings:
- `DB_CONNECTION=mysql`
- `DB_HOST=db` (Docker service name)
- `DB_PORT=3306` (internal container port)
- `DB_DATABASE=hydrosense`
- `DB_USERNAME=hydro`
- `DB_PASSWORD=secret`

---

## Docker Setup

### Starting the Containers

Start both the MySQL database and Laravel application:

```bash
docker-compose up -d
```

This will:
- Build the Laravel application image
- Start a MySQL 8.0 database container
- Expose the database on port **3307** (localhost)
- Expose the Laravel server on port **8000** (localhost)

### Initialize the Database

After containers are running, set up the database:

```bash
# Generate application key
docker-compose exec app php artisan key:generate

# Run migrations (create database tables)
docker-compose exec app php artisan migrate
```

### Useful Docker Commands

```bash
# View running containers
docker-compose ps

# View logs from a service
docker-compose logs app          # Laravel logs
docker-compose logs db           # MySQL logs

# Stop all containers
docker-compose down

# Rebuild containers (use after updating Dockerfile)
docker-compose up -d --build

# Access Laravel container shell
docker-compose exec app bash

# Run Artisan commands
docker-compose exec app php artisan <command>

# Install Composer dependencies
docker-compose exec app composer install
```

### Port Configuration

| Service | Internal Port | Host Port | URL |
|---------|--------------|-----------|-----|
| Laravel | 8000 | 8000 | http://localhost:8000 |
| MySQL | 3306 | 3307 | localhost:3307 |

**Note**: If port 3307 is already in use, change it in `docker-compose.yml`:
```yaml
ports:
  - "3307:3306"  # Change 3307 to an available port
```

---

## Frontend Development

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Create Environment File

Create `.env.local` in the frontend directory:

```
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm start
```

The React app will open at **http://localhost:3000**

### Frontend Commands

```bash
# Start development server
npm start

# Build for production
npm build

# Run tests
npm test

# Install new packages
npm install <package-name>
```

### Authentication & Pages

The application includes a complete authentication system with protected routes:

#### Login Page
- **Location**: `src/components/Login.js`
- **Route**: `/`
- **Features**:
  - Email and password authentication
  - Demo credentials: `admin@gmail.com` / `hydrosense`
  - Error handling for invalid credentials
  - Displays credentials on the page for easy testing

#### Dashboard Page
- **Location**: `src/components/Dashboard.js`
- **Route**: `/dashboard`
- **Features**:
  - Protected route (only accessible after login)
  - Welcome message with "officially logged in" status
  - Feature cards for Water Monitoring, Analytics, Settings, and Notifications
  - Logout button in navigation bar
  - Responsive design for all devices

#### Routing
- Uses React Router for client-side navigation
- Automatic redirects:
  - Not logged in → redirects to login page
  - Logged in on login page → redirects to dashboard
  - Invalid routes → redirects to login page

---

## Vercel Deployment

### 1. Set Up Vercel CLI

```bash
# Install globally (if not already done)
npm install -g vercel

# Login to Vercel
vercel login
```

### 2. Deploy Frontend to Vercel

Navigate to the frontend directory and deploy:

```bash
cd frontend
vercel --prod
```

The CLI will:
- Ask you to set up your project
- Create a new Vercel project
- Deploy the app
- Provide you with a production URL

**Example Output:**
```
✅  Production: https://hydrosense-frontend-xxx.vercel.app
🔗  Aliased: https://hydrosense-frontend.vercel.app
```

### 3. Configure Environment Variables

Once deployed to Vercel, set the production backend URL:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `hydrosense-frontend` project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-production-backend.com` (your Laravel backend URL)
5. Click **Save & Redeploy**

### Automatic Deployments

To enable automatic deployments on every push:

1. In Vercel Dashboard → Your Project
2. Go to **Settings** → **Git**
3. Connect your GitHub repository
4. Select the default branch (usually `main`)
5. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Root Directory**: `frontend`
6. Save and future pushes will auto-deploy

---

## Complete Workflow Example

### For Local Development

```bash
# 1. Start Docker containers
docker-compose up -d

# 2. Initialize database
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate

# 3. In another terminal, start frontend
cd frontend
npm start

# 4. Access your application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Database: localhost:3307
```

### For Production Deployment

```bash
# 1. Deploy backend (to Railway/Heroku/etc - separate from this guide)
# 2. Deploy frontend to Vercel
cd frontend
vercel --prod

# 3. Set production backend URL in Vercel environment variables
# 4. Frontend automatically redeploys with new configuration
```

---

## Troubleshooting

### Docker Issues

#### Port Already in Use
```bash
# Find what's using port 3307 (Windows)
netstat -ano | findstr :3307

# Kill the process
taskkill /PID <process-id> /F

# Or simply change the port in docker-compose.yml
```

#### Containers Won't Start
```bash
# Check logs
docker-compose logs

# Rebuild without cache
docker-compose down
docker-compose up -d --build
```

#### Vendor Directory Issues
The `docker-compose.yml` includes a named volume for vendor dependencies. If you experience issues:
```bash
# Remove and recreate volumes
docker-compose down -v
docker-compose up -d --build
```

### Frontend Issues

#### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rmdir /s node_modules
npm install
```

#### Port 3000 Already in Use
```bash
# On Windows, find and kill the process
netstat -ano | findstr :3000
taskkill /PID <process-id> /F

# Or specify a different port
PORT=3001 npm start
```

### Database Connection Issues

#### Can't Connect to Database
```bash
# Verify containers are running
docker-compose ps

# Check database logs
docker-compose logs db

# Confirm .env file has correct credentials
cat backend\.env
```

### Vercel Deployment Issues

#### Build Fails
1. Check build logs in Vercel Dashboard
2. Ensure all environment variables are set
3. Verify `package.json` build script exists
4. Check for missing dependencies: `npm install`

#### Frontend Can't Reach Backend
1. Verify `REACT_APP_API_URL` environment variable is set in Vercel
2. Ensure backend is deployed and accessible
3. Check CORS configuration on backend (may need to add Vercel domain)

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev/)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

## Common Laravel Artisan Commands

```bash
# Database operations
docker-compose exec app php artisan migrate          # Run migrations
docker-compose exec app php artisan migrate:rollback # Rollback last migration
docker-compose exec app php artisan seed:db          # Seed database

# Cache operations
docker-compose exec app php artisan cache:clear      # Clear application cache
docker-compose exec app php artisan config:cache     # Cache config files

# Generate assets
docker-compose exec app php artisan storage:link     # Create storage symlink

# Tinker (interactive shell)
docker-compose exec app php artisan tinker

# Serve on different host/port
docker-compose exec app php artisan serve --host=0.0.0.0 --port=8000
```

---

## Tips for Team Collaboration

1. **Always commit `.env.example`** but never commit `.env` files
2. **Run migrations after pulling changes** if database schema changed
3. **Update dependencies regularly**: `npm update` in frontend, `composer update` in backend
4. **Use `.gitignore`** to exclude local files:
   - `node_modules/`
   - `vendor/`
   - `.env`
   - `.vercel/`

---

## Summary

| Component | Local Dev | Production |
|-----------|-----------|------------|
| Frontend | http://localhost:3000 | https://hydrosense-frontend.vercel.app |
| Backend | http://localhost:8000 | (To be deployed separately) |
| Database | localhost:3307 | (Production RDS/Cloud SQL) |

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or check the official documentation links above.
