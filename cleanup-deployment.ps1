# Cleanup script for OpenSign GCP Deployment

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  OpenSign GCP Deployment Cleanup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Delete firewall rules
    Write-Host "1. Deleting firewall rules..." -ForegroundColor Yellow
    gcloud compute firewall-rules delete opensign-mongo-firewall opensign-backend-firewall opensign-frontend-firewall --quiet -q
    Write-Host "   [SUCCESS] Firewall rules deleted" -ForegroundColor Green

    # Delete reserved IP addresses
    Write-Host "2. Deleting reserved IP addresses..." -ForegroundColor Yellow
    gcloud compute addresses delete opensign-mongo-ip opensign-backend-ip opensign-frontend-ip --region=us-central1 --quiet -q
    Write-Host "   [SUCCESS] IP addresses deleted" -ForegroundColor Green

    # Delete compute instances
    Write-Host "3. Deleting compute instances..." -ForegroundColor Yellow
    gcloud compute instances delete opensign-mongo-instance opensign-backend-instance opensign-frontend-instance --zone=us-central1-a --quiet -q
    Write-Host "   [SUCCESS] Compute instances deleted" -ForegroundColor Green

    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "  Cleanup completed successfully!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan

} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   [ERROR] Cleanup failed. Please check the error message above." -ForegroundColor Red
}