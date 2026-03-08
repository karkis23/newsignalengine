@echo off
title NIFTY AI Signal Engine v4.0
color 0A
echo.
echo  ===============================================
echo   NIFTY AI Signal Engine v4.0
echo   Starting local server on http://localhost:8000
echo  ===============================================
echo.
cd /d "C:\Users\madhu\OneDrive\Desktop\n8n-workflow-bot\bolt_final\updated_final\project\api"

if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup first:
    echo    python -m venv .venv
    echo    .venv\Scripts\Activate.ps1
    echo    pip install -r requirements.txt
    pause
    exit /b 1
)

call .venv\Scripts\activate.bat
echo [OK] Virtual environment activated.
echo [OK] Starting uvicorn server...
echo.
echo    Browser Health Check : http://localhost:8000
echo    Swagger API Docs     : http://localhost:8000/docs
echo    Debug Endpoint       : http://localhost:8000/api/predict/debug
echo.
echo  Press Ctrl+C to stop the server.
echo.

uvicorn main:app --reload --port 8000 --host 0.0.0.0

echo.
echo  Server stopped.
pause
