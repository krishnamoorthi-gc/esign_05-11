@echo off
TITLE OpenSign - Simple Restart
ECHO OpenSign Simple Restart Script
ECHO =============================
ECHO.

ECHO Starting Backend Server...
start "Backend" cmd /k "cd backend\OpenSignServer && npm run dev"

timeout /t 10 /nobreak >nul

ECHO Starting Frontend Server...
start "Frontend" cmd /k "cd frontend\OpenSign && npm run dev"

ECHO.
ECHO Servers starting...
ECHO Backend: http://localhost:8081
ECHO Frontend: http://localhost:3001
ECHO.
ECHO Please wait for both servers to fully initialize.
ECHO You can close this window when ready.
pause