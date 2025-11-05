# Fix the entrypoint.sh file and redeploy the frontend

# Navigate to the frontend directory
Set-Location -Path "C:\Users\GC-IT\Documents\Backups\backup 1010\frontend\OpenSign"

# Remove the existing entrypoint.sh file
if (Test-Path "entrypoint.sh") {
    Remove-Item "entrypoint.sh" -Force
}

# Create a new entrypoint.sh file with proper Unix line endings
$entrypointContent = @'
#!/bin/sh

# Create env.js file with environment variables
echo "window.env = {" > /usr/share/nginx/html/env.js
echo "  REACT_APP_SERVERURL: `"`$REACT_APP_SERVERURL`"," >> /usr/share/nginx/html/env.js
echo "  REACT_APP_APPID: `"`$REACT_APP_APPID`"" >> /usr/share/nginx/html/env.js
echo "};" >> /usr/share/nginx/html/env.js

# Process nginx configuration with environment variables
envsubst '`${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
exec nginx -g 'daemon off;'
'@

# Write the content to the file with Unix line endings
$entrypointContent | Out-File -FilePath "entrypoint.sh" -Encoding ASCII

# Convert line endings to Unix format (LF only)
$content = Get-Content -Path "entrypoint.sh" -Raw
$content = $content -replace "`r`n", "`n"
$content | Out-File -FilePath "entrypoint.sh" -Encoding ASCII

# Make the file executable
# This is for Docker, so we just need to ensure it's in the image with proper permissions

# Go back to the root directory
Set-Location -Path "C:\Users\GC-IT\Documents\Backups\backup 1010"

# Build the Docker image
Write-Host "Building Docker image..."
docker build -t gcr.io/esign-alpha/opensign-frontend:latest -f frontend/OpenSign/Dockerfile frontend/OpenSign

# Push the Docker image
Write-Host "Pushing Docker image..."
docker push gcr.io/esign-alpha/opensign-frontend:latest

# Redeploy the frontend
Write-Host "Redeploying frontend..."
kubectl rollout restart deployment/opensign-frontend

Write-Host "Frontend redeployment initiated. Check pod status with: kubectl get pods"