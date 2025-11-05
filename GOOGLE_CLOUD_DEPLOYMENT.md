# Google Cloud Deployment Guide for OpenSign

This guide provides instructions for deploying OpenSign to Google Cloud Platform using Google Kubernetes Engine (GKE).

## Prerequisites

1. Google Cloud Account
2. Google Cloud SDK installed locally
3. Docker installed locally
4. kubectl installed
5. OpenSSL installed (for generating secure keys)

## Installation of Prerequisites

### Google Cloud SDK
If you don't have Google Cloud SDK installed, follow these steps:

1. Visit [Google Cloud SDK Installation Guide](https://cloud.google.com/sdk/docs/install)
2. Download and install the SDK for your operating system
3. Initialize the SDK by running:
   ```bash
   gcloud init
   ```

### Docker
Install Docker from [Docker's official website](https://docs.docker.com/get-docker/)

### kubectl
Install kubectl by running:
```bash
gcloud components install kubectl
```

### OpenSSL
Most systems have OpenSSL pre-installed. If not, install it from [OpenSSL's official website](https://www.openssl.org/)

## Deployment Process

### 1. Authentication
Authenticate with Google Cloud:
```bash
gcloud auth login
```

### 2. Set Project
Set your Google Cloud project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

### 3. Enable Required Services
Enable the necessary Google Cloud services:
```bash
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 4. Automated Deployment
You can use the provided deployment scripts:

#### For Linux/Mac:
```bash
./deploy-to-gcp.sh
```

#### For Windows:
```cmd
deploy-to-gcp.bat
```

### 5. Manual Deployment Steps
If you prefer to deploy manually, follow these steps:

1. Build and push Docker images:
   ```bash
   # Backend
   cd backend/OpenSignServer
   docker build -t gcr.io/YOUR_PROJECT_ID/opensign-backend:latest .
   docker push gcr.io/YOUR_PROJECT_ID/opensign-backend:latest
   
   # Frontend
   cd ../../frontend/OpenSign
   docker build -t gcr.io/YOUR_PROJECT_ID/opensign-frontend:latest .
   docker push gcr.io/YOUR_PROJECT_ID/opensign-frontend:latest
   ```

2. Create GKE cluster:
   ```bash
   gcloud container clusters create opensign-cluster \
       --num-nodes=3 \
       --zone=us-central1-a \
       --machine-type=e2-medium
   ```

3. Get cluster credentials:
   ```bash
   gcloud container clusters get-credentials opensign-cluster --zone=us-central1-a
   ```

4. Deploy to Kubernetes:
   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

## Configuration

### Environment Variables

The deployment automatically generates a secure master key and configures the following environment variables:

**Backend:**
- `APP_ID`: opensign
- `SERVER_URL`: http://opensign-backend-service:8081/app
- `MASTER_KEY`: Auto-generated secure key
- `DATABASE_URI`: mongodb://admin:password@opensign-mongo-service:27017/opensign?authSource=admin
- `PORT`: 8081
- `USE_LOCAL`: true

**Frontend:**
- `REACT_APP_SERVERURL`: http://opensign-backend-service:8081/app
- `REACT_APP_APPID`: opensign

## Accessing Your Deployment

After deployment, your application will be accessible at the external IP address provided by the LoadBalancer service:

- Frontend: http://[EXTERNAL_IP]
- Backend API: http://[EXTERNAL_IP]:8081

You can get the external IP by running:
```bash
kubectl get service opensign-frontend-service
```

## Troubleshooting

1. **Authentication Issues**: Make sure you're authenticated with `gcloud auth login` and have the correct project set.

2. **Permission Issues**: Ensure your Google Cloud account has the necessary permissions for GKE and Container Registry.

3. **Docker Build Issues**: Make sure Docker is running and you have sufficient disk space.

4. **Service Not Starting**: Check the pod logs with:
   ```bash
   kubectl logs deployment/opensign-backend
   kubectl logs deployment/opensign-frontend
   ```

5. **Resource Limits**: If you encounter resource constraints, consider upgrading your GKE cluster machine types.

## Scaling

For production deployments, consider:

1. Increasing the number of replicas in Kubernetes deployments
2. Using a managed MongoDB service like MongoDB Atlas instead of the included MongoDB container
3. Configuring autoscaling for your GKE nodes
4. Setting up monitoring and logging with Google Cloud Operations Suite

## Cleanup

To remove the deployment and cluster:

1. Delete the Kubernetes resources:
   ```bash
   kubectl delete -f k8s-deployment.yaml
   ```

2. Delete the GKE cluster:
   ```bash
   gcloud container clusters delete opensign-cluster --zone=us-central1-a
   ```

3. Delete the container images from Container Registry (optional):
   ```bash
   gcloud container images delete gcr.io/YOUR_PROJECT_ID/opensign-backend:latest
   gcloud container images delete gcr.io/YOUR_PROJECT_ID/opensign-frontend:latest
   ```