# Installing Prerequisites for Google Cloud Deployment

Before you can run the Google Cloud deployment script without Docker, you need to install the required tools.

## Required Tools

1. Google Cloud SDK
2. OpenSSL

## Installing Google Cloud SDK on Windows

1. Download the Google Cloud SDK installer:
   - Visit [Google Cloud SDK Installation Page](https://cloud.google.com/sdk/docs/install)
   - Download the Windows installer (64-bit or 32-bit based on your system)

2. Run the installer:
   - Double-click the downloaded executable file
   - Follow the installation wizard
   - Make sure to select the option to add Google Cloud SDK to your PATH

3. Restart your command prompt or PowerShell

4. Verify the installation:
   ```
   gcloud --version
   ```

## Installing OpenSSL on Windows

There are several ways to install OpenSSL on Windows:

### Option 1: Using Chocolatey (Recommended)

1. If you don't have Chocolatey installed, install it first:
   - Open PowerShell as Administrator
   - Run the installation command from [Chocolatey Installation Guide](https://chocolatey.org/install)

2. Install OpenSSL:
   ```
   choco install openssl
   ```

### Option 2: Downloading binaries

1. Visit [OpenSSL for Windows](https://slproweb.com/products/Win32OpenSSL.html)
2. Download the appropriate version for your system (usually the "Win64 OpenSSL vxxxx" version)
3. Run the installer and follow the installation wizard
4. Add the OpenSSL bin directory to your PATH environment variable

### Option 3: Using Git Bash

If you have Git for Windows installed, it includes OpenSSL:
1. Add Git's usr/bin directory to your PATH (usually C:\Program Files\Git\usr\bin)
2. Or use Git Bash to run the deployment script

## Verifying the Installation

After installing both tools, verify they are properly installed:

```cmd
gcloud --version
openssl version
```

Both commands should return version information without errors.

## Authentication with Google Cloud

After installing the Google Cloud SDK, you need to authenticate:

```cmd
gcloud auth login
gcloud auth application-default login
```

Follow the prompts in your browser to complete the authentication process.

## Enabling Required APIs

You also need to enable the required APIs for your project:

```cmd
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

## Running the Deployment Script

Once all prerequisites are installed and configured, you can run the deployment script:

For Windows Command Prompt:
```cmd
deploy-to-gcp-external-ip.bat
```

For PowerShell:
```powershell
.\deploy-to-gcp-external-ip.bat
```

The script will prompt you for:
1. Your Google Cloud Project ID
2. Desired region (defaults to us-central1)

Note: The deployment process may take 5-10 minutes to complete.