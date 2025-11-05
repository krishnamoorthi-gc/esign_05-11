# Local Development Setup Guide for OpenSign

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- LibreOffice (for DOCX to PDF conversions)

## Backend Setup (OpenSignServer)

1. Navigate to the backend directory:
   ```bash
   cd apps/OpenSignServer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and copy the content from `.env.local_dev`. Update the following variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/OpenSignDB
   SERVER_URL=http://127.0.0.1:8081/app
   USE_LOCAL=true
   APP_ID=opensign
   MASTER_KEY=your_master_key_here
   PORT=8081
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The server will start on http://localhost:8080

## Frontend Setup (OpenSign)

1. Navigate to the frontend directory:
   ```bash
   cd apps/OpenSign
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory with the following content:
   ```env
   PUBLIC_URL=http://localhost:3001
   GENERATE_SOURCEMAP=false
   REACT_APP_SERVERURL=http://localhost:8081/app
   REACT_APP_APPID=opensign
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at http://localhost:3001

## Additional Configuration

### Email Setup
Configure email settings in the backend `.env` file using either SMTP or Mailgun:

```env
# SMTP Configuration
SMTP_ENABLE=true
SMTP_HOST=smtp.yourhost.com
SMTP_PORT=443
SMTP_USER_EMAIL=mailer@yourdomain.com

# OR Mailgun Configuration
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=mail.yourdomain.com
MAILGUN_SENDER=postmaster@mail.yourdomain.com
```

### Storage Configuration
By default, the local setup uses local storage. If you need to use S3-compatible storage, update these variables in the backend `.env` file:

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