# SpeechScope AI - One-Command Launcher (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SpeechScope AI - Temporal Speech Analytics Prototype   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot
Set-Location $WorkspaceRoot

# Check Backend Virtualenv
if (-not (Test-Path "$WorkspaceRoot\backend\venv")) {
    Write-Host "[1/4] Creating Python virtual environment..." -ForegroundColor White
    python -m venv "$WorkspaceRoot\backend\venv"
    & "$WorkspaceRoot\backend\venv\Scripts\pip.exe" install --upgrade pip
    & "$WorkspaceRoot\backend\venv\Scripts\pip.exe" install -r "$WorkspaceRoot\backend\requirements.txt"
}

# Check Frontend node_modules
if (-not (Test-Path "$WorkspaceRoot\frontend\node_modules")) {
    Write-Host "[2/4] Installing frontend dependencies..." -ForegroundColor White
    Set-Location "$WorkspaceRoot\frontend"
    npm install --legacy-peer-deps
    Set-Location $WorkspaceRoot
}

# Ensure Demo Audio is Built
if (-not (Test-Path "$WorkspaceRoot\backend\dataset\good\demo_reference.wav")) {
    Write-Host "[3/4] Building official demo dataset audio..." -ForegroundColor White
    & "$WorkspaceRoot\backend\venv\Scripts\python.exe" "$WorkspaceRoot\scripts\build_demo_dataset.py"
}

Write-Host "[4/4] Launching FastAPI Backend and Vite Frontend..." -ForegroundColor Green
Write-Host "  * FastAPI Backend: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  * React Dashboard: http://127.0.0.1:5173" -ForegroundColor Cyan
Write-Host "  * Swagger API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to terminate both servers." -ForegroundColor Gray

# Launch backend and frontend in separate background jobs or processes
Start-Process -FilePath "$WorkspaceRoot\backend\venv\Scripts\python.exe" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory "$WorkspaceRoot\backend"
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev -- --host 127.0.0.1 --port 5173" -WorkingDirectory "$WorkspaceRoot\frontend"

Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:5173"
