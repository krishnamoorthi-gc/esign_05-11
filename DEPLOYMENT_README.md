# OpenSign Deployment Guide

This document provides instructions for deploying the OpenSign application to different environments.

## Deployment Options

### 1. Google Cloud Platform (Recommended)
Deploy OpenSign to Google Cloud Platform using Google Kubernetes Engine (GKE).

**Prerequisites:**
- Google Cloud Account
- Google Cloud SDK installed
- Docker installed
- kubectl installed

**Deployment Files:**
1. [deploy-to-gcp.sh](deploy-to-gcp.sh) - Automated deployment script for Linux/Mac
2. [deploy-to-gcp.bat](deploy-to-gcp.bat) - Automated deployment script for Windows
3. [k8s-deployment.yaml](k8s-deployment.yaml) - Kubernetes deployment configuration
4. [GOOGLE_CLOUD_DEPLOYMENT.md](GOOGLE_CLOUD_DEPLOYMENT.md) - Detailed deployment guide

**Quick Deployment:**
```bash
./deploy-to-gcp.sh
```
or on Windows:
```cmd
deploy-to-gcp.bat
```

### 2. Docker (Local Deployment)
Deploy OpenSign locally using Docker Compose.

**Prerequisites:**
- Docker installed
- Docker Compose installed

**Deployment Files:**
1. [docker-compose.yml](docker-compose.yml) - Docker Compose configuration

**Quick Deployment:**
```bash
docker-compose up -d
```

## Accessing the Application

After deployment, the application will be accessible at:
- **Google Cloud**: http://[EXTERNAL_IP] (IP provided after deployment)
- **Local Docker**: http://localhost

Backend API: http://[HOST]:8081/app

## Configuration

### Environment Variables

**Backend:**
- `APP_ID`: Application identifier (default: opensign)
- `SERVER_URL`: Backend server URL
- `MASTER_KEY`: Secure master key for Parse Server
- `DATABASE_URI`: MongoDB connection string
- `PORT`: Server port (default: 8081)
- `USE_LOCAL`: Use local storage (default: true)

**Frontend:**
- `REACT_APP_SERVERURL`: Backend API URL
- `REACT_APP_APPID`: Should match backend APP_ID

## Troubleshooting

### Common Issues

1. **Port Conflicts**: If ports 80, 8081, or 27017 are already in use, modify the docker-compose.yml or deployment files to use different ports.

2. **Docker Build Failures**: Ensure you have sufficient disk space and Docker is properly configured.

3. **Database Connection Issues**: Verify MongoDB is running and connection strings are correct.

4. **Frontend Not Loading**: Check that the backend is accessible and REACT_APP_SERVERURL is correctly configured.

### Logs and Debugging

To view container logs:
```bash
# For Docker deployment
docker logs [container_name]

# For Kubernetes deployment
kubectl logs deployment/[deployment_name]
```

### Support

For issues with deployment, please refer to the specific deployment guide for your chosen platform or contact the development team.