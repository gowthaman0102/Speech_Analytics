#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   SpeechScope AI - Temporal Speech Analytics Prototype   "
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Backend
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Start Frontend
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
fi
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Open http://127.0.0.1:5173 in your browser"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
