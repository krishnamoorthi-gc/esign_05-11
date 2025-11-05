# Local Setup Instructions for OpenSign

This document provides instructions for setting up and running OpenSign locally with proper frontend-backend connectivity.

## Prerequisites

1. Node.js (version 18, 20, or 22)
2. MongoDB database (local or remote)
3. Git

## Setup Instructions

### 1. Environment Configuration

The project now includes properly configured `.env` files in:
- Root directory: [.env](file:///c%3A/xampp/htdocs/open%20sign%203/.env)
- Frontend directory: [frontend/OpenSign/.env](file:///c%3A/xampp/htdocs/open%20sign%203/frontend/OpenSign/.env)
- Backend directory: [backend/OpenSignServer/.env](file:///c%3A/xampp/htdocs/open%20sign%203/backend/OpenSignServer/.env)

These files are configured with the following key settings:
- Frontend connects to backend at `http://localhost:8081/app`
- Backend runs on port 8081
- Frontend runs on port 3000
- MongoDB connects to `mongodb://localhost:27017/OpenSignDB`

### 2. Install Dependencies

Run the following commands in the root directory:
```bash
npm install
cd frontend/OpenSign
npm install
cd ../..
cd backend/OpenSignServer
npm install
cd ../..
```

Or use the root package.json scripts:
```bash
npm install
```

### 3. Start the Application

You have several options to start the application:

#### Option 1: Run both frontend and backend together (recommended)
```bash
npm run dev
```

#### Option 2: Run frontend and backend separately
```bash
# In one terminal, run the backend
npm run dev:backend

# In another terminal, run the frontend
npm run dev:frontend
```

#### Option 3: Use the batch files (Windows only)
```bash
# Run both frontend and backend
run_all.bat

# Run only backend
run_backend.bat

# Run only frontend
run_frontend.bat
```

### 4. Access the Application

After starting the application:
1. The backend will be available at: `http://localhost:8081`
2. The frontend will be available at: `http://localhost:3000`
3. The frontend will automatically open in your default browser

### 5. Verify Connectivity

To verify that the frontend and backend are properly connected:
1. Open your browser's developer tools (F12)
2. Go to the Network tab
3. Access the application at `http://localhost:3000`
4. Look for API requests to `http://localhost:8081/app`
5. These requests should return successful responses (status code 200)

### 6. Troubleshooting Common Issues

#### Issue 1: CORS Errors
- Ensure the backend is running and accessible at `http://localhost:8081`
- Check that the `REACT_APP_SERVERURL` in the frontend [.env](file:///c%3A/xampp/htdocs/open%20sign%203/frontend/OpenSign/.env) file matches the backend URL

#### Issue 2: Connection Refused
- Verify MongoDB is running and accessible
- Check that the `MONGODB_URI` in the backend [.env](file:///c%3A/xampp/htdocs/open%20sign%203/backend/OpenSignServer/.env) file is correct

#### Issue 3: APP_ID Mismatch
- Ensure the `REACT_APP_APPID` in the frontend [.env](file:///c%3A/xampp/htdocs/open%20sign%203/frontend/OpenSign/.env) file matches the `APP_ID` in the backend [.env](file:///c%3A/xampp/htdocs/open%20sign%203/backend/OpenSignServer/.env) file

#### Issue 4: Port Conflicts
- If ports 3000 or 8081 are already in use, you can change them:
  - For frontend: Modify the `PORT` variable in [frontend/OpenSign/.env](file:///c%3A/xampp/htdocs/open%20sign%203/frontend/OpenSign/.env)
  - For backend: Modify the `SERVER_URL` variable in [backend/OpenSignServer/.env](file:///c%3A/xampp/htdocs/open%20sign%203/backend/OpenSignServer/.env)

### 7. Development Notes

- The frontend uses Vite with proxy configuration for API requests
- The backend uses Parse Server with Express
- Both applications use environment variables for configuration
- Changes to most files will be automatically reflected without restarting the servers (hot reloading)