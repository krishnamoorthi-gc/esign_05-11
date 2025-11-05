# Deployment Monitor Script for OpenSign GCP Deployment

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  OpenSign GCP Deployment Monitor" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

function Check-DeploymentStatus {
    Write-Host "$(Get-Date): Checking deployment status..." -ForegroundColor Yellow
    
    # Check for reserved IP addresses
    Write-Host "Checking reserved IP addresses..." -ForegroundColor Gray
    try {
        $ipOutput = & gcloud compute addresses list --filter="name~'opensign-'" 2>&1
        if ($ipOutput -and $ipOutput.Length -gt 0) {
            Write-Host "[FOUND] Reserved IP addresses:" -ForegroundColor Green
            $ipOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        } else {
            Write-Host "[NOT FOUND] No reserved IP addresses yet" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR] Failed to check IP addresses: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Check for compute instances
    Write-Host "Checking compute instances..." -ForegroundColor Gray
    try {
        $instanceOutput = & gcloud compute instances list --filter="name~'opensign-'" 2>&1
        if ($instanceOutput -and $instanceOutput.Length -gt 0) {
            Write-Host "[FOUND] Compute instances:" -ForegroundColor Green
            $instanceOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        } else {
            Write-Host "[NOT FOUND] No compute instances yet" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR] Failed to check compute instances: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Check for firewall rules
    Write-Host "Checking firewall rules..." -ForegroundColor Gray
    try {
        $firewallOutput = & gcloud compute firewall-rules list --filter="name~'opensign-'" 2>&1
        if ($firewallOutput -and $firewallOutput.Length -gt 0) {
            Write-Host "[FOUND] Firewall rules:" -ForegroundColor Green
            $firewallOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        } else {
            Write-Host "[NOT FOUND] No firewall rules yet" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR] Failed to check firewall rules: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Run the check every 30 seconds for 10 minutes
$endTime = (Get-Date).AddMinutes(10)
$checkCount = 0

do {
    $checkCount++
    Write-Host "-----------------------------------------" -ForegroundColor DarkGray
    Write-Host "Check #$checkCount at $(Get-Date)" -ForegroundColor DarkGray
    Write-Host "-----------------------------------------" -ForegroundColor DarkGray
    
    Check-DeploymentStatus
    
    if ((Get-Date) -lt $endTime) {
        Write-Host "Waiting 30 seconds before next check..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
    }
} while ((Get-Date) -lt $endTime)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Monitoring completed" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan