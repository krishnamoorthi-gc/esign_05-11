# Deployment script for OpenSign to Google Cloud Run using Docker images

Write-Host "===============================================" -ForegroundColor Blue
Write-Host "  OpenSign Deployment to GCP Cloud Run" -ForegroundColor Blue
Write-Host "===============================================" -ForegroundColor Blue

# Set your Google Cloud project ID
$PROJECT_ID = "esign-474713"

# Set your desired region
$REGION = "us-central1"

# Set Google Cloud project
Write-Host "Setting Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable required services
Write-Host "Enabling required Google Cloud services..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com

# Generate secure master key using PowerShell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$MASTER_KEY = [System.Convert]::ToBase64String($bytes)
Write-Host "Generated secure master key" -ForegroundColor Yellow

Write-Host "Services enabled successfully!" -ForegroundColor Green
Write-Host "Docker images have been built and pushed to GCR:" -ForegroundColor Green
Write-Host "  Backend: gcr.io/$PROJECT_ID/opensign-backend:latest" -ForegroundColor Green
Write-Host "  Frontend: gcr.io/$PROJECT_ID/opensign-frontend:latest" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy to Cloud Run, run the following commands manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Deploy MongoDB (for testing only - use managed service in production):" -ForegroundColor Yellow
Write-Host "   gcloud run deploy opensign-mongodb --image mongo:6.0 --platform managed --region $REGION --allow-unauthenticated --set-env-vars='MONGO_INITDB_ROOT_USERNAME=admin,MONGO_INITDB_ROOT_PASSWORD=password' --port 27017 --memory 1Gi --cpu 1" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy Backend:" -ForegroundColor Yellow
Write-Host "   gcloud run deploy opensign-backend --image gcr.io/$PROJECT_ID/opensign-backend:latest --platform managed --region $REGION --allow-unauthenticated --set-env-vars='APP_ID=opensign,MASTER_KEY=$MASTER_KEY,SERVER_URL=https://opensign-backend-$REGION.run.app/app,USE_LOCAL=true,PORT=8081' --port 8081 --memory 1Gi --cpu 1" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy Frontend:" -ForegroundColor Yellow
Write-Host "   gcloud run deploy opensign-frontend --image gcr.io/$PROJECT_ID/opensign-frontend:latest --platform managed --region $REGION --allow-unauthenticated --port 80 --memory 512Mi --cpu 1" -ForegroundColor Gray
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Deployment preparation completed!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Your Docker images are ready for deployment to Google Cloud Run!" -ForegroundColor Blue
Write-Host "Follow the instructions above to complete the deployment." -ForegroundColor Blue