# Simplified deployment script for OpenSign to GCP

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  OpenSign GCP Deployment (Simplified)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Set project
Write-Host "Setting project..." -ForegroundColor Yellow
gcloud config set project esign-474713

# Enable services
Write-Host "Enabling required services..." -ForegroundColor Yellow
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# Generate master key
Write-Host "Generating secure master key..." -ForegroundColor Yellow
$masterKey = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Write-Host "Master key generated" -ForegroundColor Green

# Reserve IP addresses
Write-Host "Reserving IP addresses..." -ForegroundColor Yellow
gcloud compute addresses create opensign-mongo-ip --region=us-central1
gcloud compute addresses create opensign-backend-ip --region=us-central1
gcloud compute addresses create opensign-frontend-ip --region=us-central1

# Get IP addresses
Write-Host "Getting reserved IP addresses..." -ForegroundColor Yellow
$mongoIP = gcloud compute addresses describe opensign-mongo-ip --region=us-central1 --format="value(address)"
$backendIP = gcloud compute addresses describe opensign-backend-ip --region=us-central1 --format="value(address)"
$frontendIP = gcloud compute addresses describe opensign-frontend-ip --region=us-central1 --format="value(address)"

Write-Host "Reserved IP addresses:" -ForegroundColor Green
Write-Host "  MongoDB: $mongoIP" -ForegroundColor Gray
Write-Host "  Backend: $backendIP" -ForegroundColor Gray
Write-Host "  Frontend: $frontendIP" -ForegroundColor Gray

# Create firewall rules
Write-Host "Creating firewall rules..." -ForegroundColor Yellow
gcloud compute firewall-rules create opensign-mongo-firewall --allow tcp:27017 --source-ranges="$backendIP/32" --description="Allow MongoDB access from backend"
gcloud compute firewall-rules create opensign-backend-firewall --allow tcp:8081 --source-ranges=0.0.0.0/0 --description="Allow backend API access"
gcloud compute firewall-rules create opensign-frontend-firewall --allow tcp:80,tcp:443 --source-ranges=0.0.0.0/0 --description="Allow frontend access"

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create VM instances (manually or via additional scripts)" -ForegroundColor Gray
Write-Host "2. Configure instances with appropriate software" -ForegroundColor Gray
Write-Host "3. Deploy OpenSign application components" -ForegroundColor Gray
Write-Host ""
Write-Host "IP addresses for manual instance creation:" -ForegroundColor Yellow
Write-Host "  MongoDB: $mongoIP" -ForegroundColor Gray
Write-Host "  Backend: $backendIP" -ForegroundColor Gray
Write-Host "  Frontend: $frontendIP" -ForegroundColor Gray