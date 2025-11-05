#!/bin/sh

# Create env.js file with environment variables
echo "window.env = {" > /usr/share/nginx/html/env.js
echo "  REACT_APP_SERVERURL: \"$REACT_APP_SERVERURL\"," >> /usr/share/nginx/html/env.js
echo "  REACT_APP_APPID: \"$REACT_APP_APPID\"" >> /usr/share/nginx/html/env.js
echo "};" >> /usr/share/nginx/html/env.js

# Set default PORT if not provided
export PORT=${PORT:-8080}

# Copy nginx configuration with PORT substitution
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
exec nginx -g 'daemon off;'