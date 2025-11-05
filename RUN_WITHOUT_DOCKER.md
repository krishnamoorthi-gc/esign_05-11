# Running OpenSign Without Docker

This guide explains how to run OpenSign without Docker.

## Prerequisites

Before you begin, ensure you have the following installed:
1. Node.js (v18 or higher)
2. MongoDB (v6.0 or higher)
3. LibreOffice (for DOCX to PDF conversions)

## Setup Instructions

### 1. Backend Setup (OpenSignServer)

1. Navigate to the backend directory:
   ```bash
   cd apps/OpenSignServer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `apps/OpenSignServer` directory with the following content:
   ```env
   APP_ID=opensign
   MASTER_KEY=XnAadwKxxByMr
   MONGODB_URI=mongodb://localhost:27017/OpenSignDB
   SERVER_URL=http://localhost:8080/app
   USE_LOCAL=true
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The server will start on http://localhost:8081

   **Windows users**: You can also double-click on `run_backend.bat` to start the backend service.

### 2. Frontend Setup (OpenSign)

1. Navigate to the frontend directory:
   ```bash
   cd apps/OpenSign
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `apps/OpenSign` directory with the following content:
   ```env
   PUBLIC_URL=http://localhost:3000
   GENERATE_SOURCEMAP=false
   REACT_APP_SERVERURL=http://localhost:8080/app
   REACT_APP_APPID=opensign
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at http://localhost:3000

   **Windows users**: You can also double-click on `run_frontend.bat` to start the frontend service.

### 3. Running Both Services Together

To run both services simultaneously, you have two options:

**Option 1: Using npm script (from the root directory)**
```bash
npm run dev
```

**Option 2: Using batch files (Windows only)**
Double-click on `run_all.bat` to start both services in separate command windows.

This will start both the backend and frontend services concurrently.

## Additional Configuration

### Email Setup
If you need email functionality, configure email settings in the backend `.env` file using either SMTP or Mailgun:

```env
# SMTP Configuration
SMTP_ENABLE=true
SMTP_HOST=smtp.yourhost.com
SMTP_PORT=443
SMTP_USER_EMAIL=mailer@yourdomain.com
SMTP_PASS=yourpassword

# OR Mailgun Configuration
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=mail.yourdomain.com
MAILGUN_SENDER=postmaster@mail.yourdomain.com
```

### Storage Configuration
The local setup uses local storage by default (as configured with `USE_LOCAL=true`). If you need to use S3-compatible storage, update these variables in the backend `.env` file:

```env
USE_LOCAL=false
DO_SPACE=your_bucket_name
DO_ENDPOINT=your_endpoint
DO_BASEURL=your_base_url
DO_ACCESS_KEY_ID=your_access_key
DO_SECRET_ACCESS_KEY=your_secret_key
DO_REGION=your_region
```

## Troubleshooting

1. If MongoDB fails to connect, ensure the MongoDB service is running and the connection string is correct.
2. For DOCX to PDF conversion issues, verify LibreOffice is properly installed and accessible.
3. If the frontend can't connect to the backend, check if the `REACT_APP_SERVERURL` matches the backend's running port and URL.