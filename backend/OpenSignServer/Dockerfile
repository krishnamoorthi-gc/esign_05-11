# Use an official Node runtime as the base image
FROM node:20-alpine

# Install LibreOffice for DOCX to PDF conversions and OpenSSL for migrations
RUN apk add --no-cache libreoffice openssl

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install application dependencies
RUN npm ci --only=production

# Copy the current directory contents into the container
COPY . .

# Make port 8081 available to the world outside this container
EXPOSE 8081

# Run the application
CMD ["npm", "start"]