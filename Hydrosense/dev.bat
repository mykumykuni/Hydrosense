@echo off
REM Hydrosense Development Script for Windows

echo.
echo ========================================
echo    HYDROSENSE DEVELOPMENT SETUP
echo ========================================
echo.

REM Display service URLs
echo.
echo ========================================
echo    SERVICES READY
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: Same-origin via /api/* (Vercel serverless routes)
echo.

REM Start frontend
echo Starting frontend development server...
cd frontend
npm start
