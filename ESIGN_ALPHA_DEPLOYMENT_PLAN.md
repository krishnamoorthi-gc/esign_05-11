# Esign Alpha Deployment Plan to Google Cloud Platform

## Project Information
- **Project Name**: Esign Alpha
- **Project ID**: esign-alpha-474811
- **Project Number**: 498925996411

## Prerequisites Checklist
- [x] Google Cloud SDK installed
- [x] Google Cloud authentication configured
- [ ] Docker service running with proper permissions
- [x] kubectl installed
- [ ] OpenSSL available (for master key generation)

## Deployment Steps

### 1. Environment Setup
```bash
# Set the project
gcloud config set project esign-alpha-474811

# Enable required services
gcloud services enable container.googleapis.com compute.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# Configure Docker authentication
gcloud auth configure-docker
```

### 2. Docker Image Building
```bash
# Build backend image
cd backend/OpenSignServer
docker build -t gcr.io/esign-alpha-474811/opensign-backend:latest .

# Push backend image
docker push gcr.io/esign-alpha-474811/opensign-backend:latest

# Build frontend image
cd ../../frontend/OpenSign
docker build -t gcr.io/esign-alpha-474811/opensign-frontend:latest .

# Push frontend image
docker push gcr.io/esign-alpha-474811/opensign-frontend:latest
```

### 3. GKE Cluster Creation
```bash
# Create cluster with autoscaling
gcloud container clusters create opensign-cluster \
    --num-nodes=3 \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=5
```

### 4. Kubernetes Deployment
```bash
# Get cluster credentials
gcloud container clusters get-credentials opensign-cluster --zone=us-central1-a

# Deploy services
kubectl apply -f k8s-deployment.yaml

# Wait for services to be ready
kubectl wait --for=condition=available --timeout=600s deployment/opensign-backend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-frontend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-mongo
```

## Configuration Details

### Environment Variables
The deployment uses the following environment variables:

**Backend Configuration:**
- `APP_ID`: opensign
- `SERVER_URL`: http://opensign-backend-service:8081/app
- `MASTER_KEY`: Auto-generated secure key (32-character base64 string)
- `DATABASE_URI`: mongodb://admin:password@opensign-mongo-service:27017/opensign?authSource=admin
- `PORT`: 8081
- `USE_LOCAL`: true

**Frontend Configuration:**
- `REACT_APP_SERVERURL`: http://opensign-backend-service:8081/app
- `REACT_APP_APPID`: opensign

## Services Deployed

1. **MongoDB Database**
   - Service name: opensign-mongo-service
   - Port: 27017
   - Type: ClusterIP (internal access only)

2. **Backend API**
   - Service name: opensign-backend-service
   - Port: 8081
   - Type: ClusterIP (internal access only)

3. **Frontend Web Application**
   - Service name: opensign-frontend-service
   - Port: 80
   - Type: LoadBalancer (external access)

## Access Information

After successful deployment:
- Frontend will be accessible at: http://[EXTERNAL_IP]
- Backend API will be accessible at: http://[EXTERNAL_IP]:8081

Get the external IP with:
```bash
kubectl get service opensign-frontend-service
```

## Monitoring Commands

```bash
# Check service status
kubectl get services

# Check pod status
kubectl get pods

# Check logs
kubectl logs deployment/opensign-backend
kubectl logs deployment/opensign-frontend
kubectl logs deployment/opensign-mongo

# Describe services for detailed information
kubectl describe service opensign-frontend-service
kubectl describe service opensign-backend-service
```

## Scaling Configuration

The deployment is configured with:
- GKE cluster autoscaling: 1-5 nodes
- Backend replicas: 2
- Frontend replicas: 2
- MongoDB replicas: 1

## Cleanup Procedure

To remove the deployment:
```bash
# Delete Kubernetes resources
kubectl delete -f k8s-deployment.yaml

# Delete GKE cluster
gcloud container clusters delete opensign-cluster --zone=us-central1-a

# Optional: Delete container images
gcloud container images delete gcr.io/esign-alpha-474811/opensign-backend:latest
gcloud container images delete gcr.io/esign-alpha-474811/opensign-frontend:latest
```

## Troubleshooting

### Common Issues

1. **Docker Permission Issues**
   - Ensure Docker is running with administrator privileges
   - On Windows, run the terminal as Administrator

2. **Authentication Issues**
   - Re-authenticate with: `gcloud auth login`
   - Verify project with: `gcloud config list`

3. **Service Not Starting**
   - Check pod logs: `kubectl logs [pod-name]`
   - Check service descriptions: `kubectl describe pod [pod-name]`

4. **Resource Constraints**
   - Upgrade machine type in cluster creation
   - Increase node count

### Useful Commands

```bash
# Check cluster status
gcloud container clusters describe opensign-cluster --zone=us-central1-a

# Get cluster credentials
gcloud container clusters get-credentials opensign-cluster --zone=us-central1-a

# Check resource usage
kubectl top nodes
kubectl top pods
```

## Next Steps

1. Ensure Docker is running with proper permissions
2. Execute the deployment steps in order
3. Monitor the deployment progress
4. Verify access to the frontend and backend services
5. Test application functionality

## Additional Security Considerations

1. **Master Key Protection**
   - Store the master key securely
   - Rotate the key periodically

2. **Database Security**
   - Change default MongoDB credentials
   - Consider using a managed database service

3. **Network Security**
   - Configure firewall rules
   - Use private clusters for production

4. **Monitoring and Logging**
   - Enable Google Cloud Operations Suite
   - Set up alerts for critical metrics