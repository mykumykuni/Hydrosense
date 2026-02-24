@echo off
REM Hydrosense Development Script for Windows

echo.
echo ========================================
echo    HYDROSENSE DEVELOPMENT SETUP
echo ========================================
echo.

REM Check if Docker is running
echo Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

echo Docker is running.
echo.

REM Start Docker containers
echo Starting Docker containers...
docker-compose up -d
if errorlevel 1 (
    echo Error: Failed to start Docker containers.
    exit /b 1
)

echo Docker containers started.
echo.

REM Wait a moment for services to be ready
timeout /t 3 /nobreak

REM Display service URLs
echo.
echo ========================================
echo    SERVICES READY
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo Database: localhost:3307
echo.

REM Start frontend
echo Starting frontend development server...
cd frontend
npm start
