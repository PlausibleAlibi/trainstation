# Nginx reverse proxy for TrainStation production
FROM nginx:1.27-alpine

# Configure logging to stdout/stderr for Docker
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
 && ln -sf /dev/stderr /var/log/nginx/error.log

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf.default || true

# Expose port 80
EXPOSE 80

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]