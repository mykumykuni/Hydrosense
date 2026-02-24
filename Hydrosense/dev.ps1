# Hydrosense Development Setup Script for PowerShell

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    HYDROSENSE DEVELOPMENT SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps > $null 2>&1
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start Docker containers
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: Failed to start Docker containers" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker containers started" -ForegroundColor Green
Write-Host ""

# Wait for services to be ready
Start-Sleep -Seconds 3

# Display service URLs
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SERVICES READY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "Database: localhost:3307" -ForegroundColor Green
Write-Host ""

# Start frontend
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Set-Location frontend
npm start
