# Esign Alpha Deployment to Google Cloud Platform

This guide provides instructions for deploying the Esign Alpha project to Google Cloud Platform.

## Project Information

- **Project Name**: Esign Alpha
- **Project ID**: esign-alpha-474811
- **Project Number**: 498925996411

## Prerequisites

1. Google Cloud Account with billing enabled
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

### Option 1: Automated Deployment (Recommended)

#### For Linux/Mac:
```bash
./deploy-esign-alpha-to-gcp.sh
```

#### For Windows:
```cmd
deploy-esign-alpha-to-gcp.bat
```

### Option 2: Manual Deployment Steps

1. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   ```

2. Set your Google Cloud project:
   ```bash
   gcloud config set project esign-alpha-474811
   ```

3. Enable the necessary Google Cloud services:
   ```bash
   gcloud services enable container.googleapis.com
   gcloud services enable compute.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

4. Build and push Docker images:
   ```bash
   # Backend
   cd backend/OpenSignServer
   docker build -t gcr.io/esign-alpha-474811/opensign-backend:latest .
   docker push gcr.io/esign-alpha-474811/opensign-backend:latest
   
   # Frontend
   cd ../../frontend/OpenSign
   docker build -t gcr.io/esign-alpha-474811/opensign-frontend:latest .
   docker push gcr.io/esign-alpha-474811/opensign-frontend:latest
   ```

5. Create GKE cluster:
   ```bash
   gcloud container clusters create opensign-cluster \
       --num-nodes=3 \
       --zone=us-central1-a \
       --machine-type=e2-medium \
       --enable-autoscaling \
       --min-nodes=1 \
       --max-nodes=5
   ```

6. Get cluster credentials:
   ```bash
   gcloud container clusters get-credentials opensign-cluster --zone=us-central1-a
   ```

7. Deploy to Kubernetes:
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

## Deployment Information

After successful deployment, a file named `deployment-info.txt` will be created with:
- External IP addresses
- Master key
- Access commands for future management

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

The deployment is configured with autoscaling enabled:
- Minimum nodes: 1
- Maximum nodes: 5
- Backend replicas: 2
- Frontend replicas: 2

## Monitoring

To monitor your deployment:

1. Check service status:
   ```bash
   kubectl get services
   ```

2. Check pod status:
   ```bash
   kubectl get pods
   ```

3. Check cluster status:
   ```bash
   gcloud container clusters describe opensign-cluster --zone=us-central1-a
   ```

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
   gcloud container images delete gcr.io/esign-alpha-474811/opensign-backend:latest
   gcloud container images delete gcr.io/esign-alpha-474811/opensign-frontend:latest
   ```