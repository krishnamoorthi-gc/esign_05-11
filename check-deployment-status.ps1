# Script to check the status of the OpenSign deployment to Google Cloud

Write-Host "Checking OpenSign deployment status..." -ForegroundColor Yellow
Write-Host ""

# Check if the reserved IP addresses exist
Write-Host "1. Checking reserved IP addresses..." -ForegroundColor Cyan
try {
    $ipAddresses = gcloud compute addresses list --filter="name~'opensign-'" --format="value(name,address)" 2>$null
    if ($ipAddresses) {
        Write-Host "[SUCCESS] Reserved IP addresses found:" -ForegroundColor Green
        $ipAddresses | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "[IN PROGRESS] No reserved IP addresses found yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to check IP addresses: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Checking compute instances..." -ForegroundColor Cyan
try {
    $instances = gcloud compute instances list --filter="name~'opensign-'" --format="value(name,status)" 2>$null
    if ($instances) {
        Write-Host "[SUCCESS] Compute instances found:" -ForegroundColor Green
        $instances | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "[IN PROGRESS] No compute instances found yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to check compute instances: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Checking firewall rules..." -ForegroundColor Cyan
try {
    $firewallRules = gcloud compute firewall-rules list --filter="name~'opensign-'" --format="value(name)" 2>$null
    if ($firewallRules) {
        Write-Host "[SUCCESS] Firewall rules found:" -ForegroundColor Green
        $firewallRules | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "[IN PROGRESS] No firewall rules found yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to check firewall rules: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deployment Status Summary:" -ForegroundColor Yellow
if ($ipAddresses -and $instances -and $firewallRules) {
    Write-Host "[DEPLOYMENT COMPLETE] All resources have been created successfully" -ForegroundColor Green
} elseif ($ipAddresses -or $instances -or $firewallRules) {
    Write-Host "[DEPLOYMENT IN PROGRESS] Some resources have been created" -ForegroundColor Yellow
} else {
    Write-Host "[DEPLOYMENT STARTING] No resources created yet" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Note: The complete deployment process typically takes 5-10 minutes." -ForegroundColor Gray
Write-Host "Run this script again in a few minutes to check progress." -ForegroundColor Gray