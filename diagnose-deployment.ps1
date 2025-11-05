# Diagnostic script for OpenSign GCP Deployment

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  OpenSign GCP Deployment Diagnosis" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Check project configuration
    Write-Host "1. Checking project configuration..." -ForegroundColor Yellow
    $project = gcloud config list project --format="value(core.project)"
    Write-Host "   Project: $project" -ForegroundColor Gray

    # Check if instances are running
    Write-Host "2. Checking instance status..." -ForegroundColor Yellow
    $instances = gcloud compute instances list --filter="name~'opensign-'" --format="table(name,status)"
    if ($instances) {
        $instances | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "   No instances found" -ForegroundColor Red
    }

    # Check firewall rules
    Write-Host "3. Checking firewall rules..." -ForegroundColor Yellow
    $firewallRules = gcloud compute firewall-rules list --filter="name~'opensign-'" --format="table(name,network,direction,allowed)"
    if ($firewallRules) {
        $firewallRules | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "   No firewall rules found" -ForegroundColor Red
    }

    # Check IP addresses
    Write-Host "4. Checking IP addresses..." -ForegroundColor Yellow
    $addresses = gcloud compute addresses list --filter="name~'opensign-'" --format="table(name,address,status)"
    if ($addresses) {
        $addresses | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "   No IP addresses found" -ForegroundColor Red
    }

    # Check if services are responding
    Write-Host "5. Checking service connectivity..." -ForegroundColor Yellow
    
    # Get the frontend IP
    $frontendIP = gcloud compute addresses describe opensign-frontend-ip --region=us-central1 --format="value(address)"
    if ($frontendIP) {
        Write-Host "   Frontend IP: $frontendIP" -ForegroundColor Gray
        
        # Test connectivity (this is a simple test, in practice you might want to use more sophisticated checks)
        Write-Host "   Testing connectivity to frontend..." -ForegroundColor Gray
        # We'll just show the command that would be used for testing
        Write-Host "   You can test connectivity using: Test-NetConnection $frontendIP -Port 80" -ForegroundColor Gray
    } else {
        Write-Host "   Could not retrieve frontend IP" -ForegroundColor Red
    }

    # Get the backend IP
    $backendIP = gcloud compute addresses describe opensign-backend-ip --region=us-central1 --format="value(address)"
    if ($backendIP) {
        Write-Host "   Backend IP: $backendIP" -ForegroundColor Gray
        Write-Host "   Testing connectivity to backend..." -ForegroundColor Gray
        Write-Host "   You can test connectivity using: Test-NetConnection $backendIP -Port 8081" -ForegroundColor Gray
    } else {
        Write-Host "   Could not retrieve backend IP" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "  Diagnosis Complete" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Common troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Wait a few more minutes for instances to fully initialize" -ForegroundColor Gray
    Write-Host "2. SSH into instances to check startup script logs:" -ForegroundColor Gray
    Write-Host "   gcloud compute ssh opensign-frontend-instance --zone=us-central1-a" -ForegroundColor Gray
    Write-Host "3. Check if Nginx is running on the frontend instance:" -ForegroundColor Gray
    Write-Host "   sudo systemctl status nginx" -ForegroundColor Gray
    Write-Host "4. Check if the Node.js application is running:" -ForegroundColor Gray
    Write-Host "   pm2 status" -ForegroundColor Gray
    Write-Host "5. Check firewall rules to ensure port 80 is open for the frontend" -ForegroundColor Gray

} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   [ERROR] Diagnosis failed. Please check the error message above." -ForegroundColor Red
}