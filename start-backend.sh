#!/bin/bash
cd backend
source venv/bin/activate 2>/dev/null || source ../venv/bin/activate 2>/dev/null || source ../.venv/bin/activate
echo "🚀 Starting backend on port 9001..."
python main.py
