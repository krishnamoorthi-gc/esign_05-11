@echo off
echo Starting OpenSign Backend Server...
start "Backend" cmd /k "cd backend\OpenSignServer && npm run dev"
timeout /t 10
echo Starting OpenSign Frontend Server...
start "Frontend" cmd /k "cd frontend\OpenSign && npm run dev"
echo.
echo Servers started successfully!
echo Backend: http://localhost:8081
echo Frontend: http://localhost:3001
echo.
pause