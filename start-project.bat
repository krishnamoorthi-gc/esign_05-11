@echo off
echo Starting OpenSign Project...
echo Make sure Docker is running with MongoDB container
echo.

REM Check if MongoDB container is running
docker ps | findstr mongodb >nul
if %errorlevel% == 0 (
    echo MongoDB container is running
) else (
    echo Starting MongoDB container...
    docker start mongodb
    timeout /t 10
)

echo.
echo Starting OpenSign Frontend and Backend...
npm run dev