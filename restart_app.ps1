# Restart OpenSign Application
Write-Host "Restarting OpenSign Application..." -ForegroundColor Green
Write-Host ""

# Start MongoDB
Write-Host "Starting MongoDB..." -ForegroundColor Yellow
try {
    Start-Service MongoDB -ErrorAction Stop
    Write-Host "MongoDB started successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to start MongoDB: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please make sure MongoDB is installed as a service" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k cd backend\OpenSignServer && npm run dev" -WorkingDirectory "C:\Users\GC-IT\Documents\Backups\backup 0710" -WindowStyle Normal

Write-Host "Waiting 10 seconds for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k cd frontend\OpenSign && npm run dev" -WorkingDirectory "C:\Users\GC-IT\Documents\Backups\backup 0710" -WindowStyle Normal

Write-Host ""
Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8081" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")