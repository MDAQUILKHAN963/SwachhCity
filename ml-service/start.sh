#!/bin/bash
echo "Starting SwachhCity ML Service..."
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
