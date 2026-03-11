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
    echo [INFO] Virtual environment not found. Creating it...
    python -m pip install virtualenv
    python -m virtualenv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [INFO] Environment created. Installing dependencies...
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install requirements.
        pause
        exit /b 1
    )
    echo [INFO] Setup complete.
)

call .venv\Scripts\activate.bat
echo [OK] Virtual environment activated (.venv)
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
