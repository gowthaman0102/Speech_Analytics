@echo off
echo ==========================================================
echo    SpeechScope AI - Temporal Speech Analytics Prototype
echo ==========================================================
cd /d "%~dp0"

echo Launching Backend server on port 8000...
start "SpeechScope Backend" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo Launching Frontend server on port 5173...
start "SpeechScope Frontend" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo Opening browser at http://127.0.0.1:5173 ...
timeout /t 3 >nul
start http://127.0.0.1:5173
