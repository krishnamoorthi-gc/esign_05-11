# Deploy OpenSign to Google Cloud Platform with External IP Addresses (Without Docker)

This guide explains how to deploy OpenSign to Google Cloud Platform (GCP) without using Docker containers, with each service (MongoDB, backend, frontend) running on separate virtual machines with dedicated external IP addresses.

## Prerequisites

1. Google Cloud SDK installed on your local machine
2. OpenSSL installed on your local machine
3. A Google Cloud Platform account with billing enabled
4. Basic knowledge of Google Cloud Platform services

## Deployment Architecture

This deployment creates three separate virtual machines:
1. **MongoDB Instance** - Runs the MongoDB database service
2. **Backend Instance** - Runs the OpenSign backend server
3. **Frontend Instance** - Runs the OpenSign frontend application

Each instance is assigned a static external IP address for direct access.

## Deployment Steps

### 1. Prepare Your Environment

Ensure you have the required tools installed:

```bash
# Check if Google Cloud SDK is installed
gcloud --version

# Check if OpenSSL is installed
openssl version
```

If any tools are missing, install them following the official documentation.

### 2. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
```

### 3. Run the Deployment Script

#### For Linux/macOS:

```bash
chmod +x deploy-to-gcp-external-ip.sh
./deploy-to-gcp-external-ip.sh
```

#### For Windows:

```cmd
deploy-to-gcp-external-ip.bat
```

### 4. Provide Required Information

The script will prompt you for:
- Your Google Cloud Project ID
- Desired region (defaults to us-central1)

### 5. Wait for Deployment

The script will:
1. Reserve static external IP addresses for each service
2. Create firewall rules for secure communication
3. Provision virtual machines with appropriate configurations
4. Install and configure all required software
5. Deploy and start the OpenSign services

This process may take 5-10 minutes to complete.

## Architecture Details

### Network Configuration

- **MongoDB Instance**: 
  - External IP for internal access only
  - Firewall rule allowing connections only from the backend instance
  - Configured to accept external connections (bound to 0.0.0.0)

- **Backend Instance**:
  - Publicly accessible external IP
  - Firewall rule allowing API access on port 8081
  - Connects to MongoDB using its external IP

- **Frontend Instance**:
  - Publicly accessible external IP
  - Firewall rule allowing HTTP/HTTPS access
  - Connects to backend API using its external IP

### Security Considerations

1. MongoDB is configured to accept connections only from the backend instance
2. Each service runs on a separate virtual machine
3. Static external IP addresses are reserved for consistent access
4. Firewall rules limit access to only necessary ports

## Post-Deployment Configuration

### Accessing Your Application

After deployment, you can access your OpenSign application at:
- **Frontend**: `http://[FRONTEND_EXTERNAL_IP]`
- **Backend API**: `http://[BACKEND_EXTERNAL_IP]:8081`

### SSH Access to Instances

You can SSH into any instance using gcloud:

```bash
# MongoDB instance
gcloud compute ssh opensign-mongo-instance --zone=[ZONE]

# Backend instance
gcloud compute ssh opensign-backend-instance --zone=[ZONE]

# Frontend instance
gcloud compute ssh opensign-frontend-instance --zone=[ZONE]
```

### Checking Service Status

After SSHing into an instance, you can check the status of services:

```bash
# Check if services are running with PM2
pm2 status

# View service logs
pm2 logs

# Check if Nginx is running (frontend instance only)
systemctl status nginx
```

### Email Configuration

The deployment scripts automatically configure the SMTP settings for email functionality using Gmail SMTP:
- SMTP Host: smtp.gmail.com
- SMTP Port: 587
- SMTP User: vatgcbs15@gmail.com
- SMTP Password: "eacb ytol wvvz nzcu"

These settings are configured in the backend environment file during deployment.

## Customization Options

### Changing Instance Types

By default, all instances use `e2-medium` machine types. You can modify the deployment script to use different machine types based on your requirements:

```bash
--machine-type=e2-standard-2  # For more powerful instances
--machine-type=e2-small       # For less powerful instances
```

### Adjusting Firewall Rules

The deployment script creates basic firewall rules. You can modify these rules to restrict access further:

```bash
# Example: Allow access only from specific IP ranges
gcloud compute firewall-rules create opensign-frontend-firewall \
    --allow tcp:80,tcp:443 \
    --source-ranges=YOUR_IP_RANGE \
    --description="Allow frontend access"
```

## Troubleshooting

### Common Issues

1. **Deployment fails due to quota limits**:
   - Check your GCP quotas for compute engine instances and static IP addresses
   - Request quota increases if necessary

2. **Services not starting correctly**:
   - SSH into the instance and check PM2 logs: `pm2 logs`
   - Verify environment variables are correctly set
   - Check if all dependencies were installed correctly

3. **Connection issues between services**:
   - Verify firewall rules are correctly configured
   - Check if external IP addresses are correctly set in configuration files
   - Ensure MongoDB is bound to 0.0.0.0 and not just localhost

### Verifying Deployment

You can verify that your deployment was successful by checking:

1. All instances are running:
   ```bash
   gcloud compute instances list --filter="name~'opensign-'"
   ```

2. All external IP addresses are reserved:
   ```bash
   gcloud compute addresses list --filter="name~'opensign-'"
   ```

3. Firewall rules are in place:
   ```bash
   gcloud compute firewall-rules list --filter="name~'opensign-'"
   ```

## Cleaning Up

To remove all resources created by this deployment:

```bash
# Delete instances
gcloud compute instances delete opensign-mongo-instance opensign-backend-instance opensign-frontend-instance --zone=[ZONE]

# Delete static IP addresses
gcloud compute addresses delete opensign-mongo-ip opensign-backend-ip opensign-frontend-ip --region=[REGION]

# Delete firewall rules
gcloud compute firewall-rules delete opensign-mongo-firewall opensign-backend-firewall opensign-frontend-firewall
```

## Next Steps

1. **Configure SSL certificates** for secure HTTPS access
2. **Set up domain names** pointing to your external IP addresses
3. **Configure backups** for your MongoDB database
4. **Monitor your instances** using Google Cloud Monitoring
5. **Set up logging** for better observability

This deployment provides a solid foundation for running OpenSign on Google Cloud Platform without Docker while maintaining direct external access to each service.