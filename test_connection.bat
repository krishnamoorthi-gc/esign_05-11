@echo off
echo Testing OpenSign Server Connection...
echo.

echo Testing Backend Server Connection...
curl -f http://localhost:8081/app 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend server is accessible
) else (
    echo ❌ Backend server is not accessible
    echo    Please make sure the backend server is running on port 8081
)
echo.

echo Testing MongoDB Connection...
cd backend\OpenSignServer
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/OpenSignDB', {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {console.log('✅ MongoDB connection successful'); process.exit(0);}).catch(err => {console.log('❌ MongoDB connection failed:', err.message); process.exit(1);});" 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB is accessible
) else (
    echo ❌ MongoDB is not accessible
    echo    Please make sure MongoDB is running
)
echo.

echo Connection tests completed.
pause