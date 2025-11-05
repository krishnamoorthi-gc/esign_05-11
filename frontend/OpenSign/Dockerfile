# Use an official Node runtime as the base image
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Install curl and other dependencies needed for the build process
RUN apk add --no-cache curl

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install application dependencies including dev dependencies needed for build
RUN npm ci

# Copy the current directory contents into the container
COPY . .

# Define environment variables
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# Build the application
RUN npm run build

# Use the official nginx image
FROM nginx:alpine

# Copy the build output to the nginx html directory
COPY build/ /usr/share/nginx/html/

# Copy env.js to the nginx html directory
COPY public/env.js /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
