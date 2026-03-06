# Hydrosense Development Setup Script for PowerShell

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    HYDROSENSE DEVELOPMENT SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display service URLs
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SERVICES READY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API: Same-origin via /api/* (Vercel serverless routes)" -ForegroundColor Green
Write-Host ""

# Start frontend
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Set-Location frontend
npm start
