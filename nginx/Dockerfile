FROM nginx:1.27-alpine

# Send logs to docker stdout/stderr
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

# Copy nginx configurations
COPY nginx.*.conf /etc/nginx/conf.d/

# Default to production config - can be overridden by volume mounts
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]