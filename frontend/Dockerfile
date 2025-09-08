# lightweight nginx container
FROM nginx:alpine

# copy build artifacts
COPY dist/ /usr/share/nginx/html

# optional: custom nginx config
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80