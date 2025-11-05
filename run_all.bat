@echo off
TITLE OpenSign - Start All Services
ECHO Starting OpenSign Services...
ECHO.
ECHO Starting Backend Server...
start "Backend" cmd /k "cd backend\OpenSignServer && npm run dev"
timeout /t 10 >nul
ECHO Starting Frontend Server...
start "Frontend" cmd /k "cd frontend\OpenSign && npm run dev"
ECHO.
ECHO Services started successfully!
ECHO Backend: http://localhost:8081
ECHO Frontend: http://localhost:3001
ECHO.
pause