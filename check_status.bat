@echo off
echo Checking OpenSign Application Status...
echo.

echo Checking MongoDB Service...
sc query MongoDB | findstr STATE
if %errorlevel% neq 0 (
    echo MongoDB service not found or not running
) else (
    echo MongoDB service found
)
echo.

echo Checking if required ports are in use...
echo Port 8081 (Backend):
netstat -an | findstr :8081
if %errorlevel% neq 0 (
    echo Port 8081 is free
) else (
    echo Port 8081 is in use
)
echo.

echo Port 3001 (Frontend):
netstat -an | findstr :3001
if %errorlevel% neq 0 (
    echo Port 3001 is free
) else (
    echo Port 3001 is in use
)
echo.

echo Environment Files:
if exist "backend\OpenSignServer\.env" (
    echo Backend .env file: Found
) else (
    echo Backend .env file: Missing
)
if exist "frontend\OpenSign\.env" (
    echo Frontend .env file: Found
) else (
    echo Frontend .env file: Missing
)
echo.

echo All checks completed.
pause