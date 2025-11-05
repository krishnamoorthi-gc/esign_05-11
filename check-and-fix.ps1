# Check the status of the pods and fix the frontend deployment if needed

Set-Location -Path "C:\Users\GC-IT\Documents\Backups\backup 1010"

Write-Host "Checking pod status..."
kubectl get pods

Write-Host "Applying fixed deployment..."
kubectl apply -f k8s-deployment-fixed.yaml

Write-Host "Checking pod status after deployment update..."
Start-Sleep -Seconds 10
kubectl get pods

Write-Host "If the frontend pod is still crashing, check its logs with:"
Write-Host "kubectl logs <frontend-pod-name>"