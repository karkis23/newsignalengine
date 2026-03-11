@echo off
title n8n — Workflow Automation
color 0B

echo.
echo  ================================================
echo   n8n Workflow Automation
echo   Starting n8n Server...
echo  ================================================
echo.

echo  [*] Launching n8n on http://localhost:5678
echo  [*] Press Ctrl+C to stop n8n.
echo.

npx n8n start

pause
