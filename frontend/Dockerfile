# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# make sure your code uses import.meta.env.VITE_API_BASE (we'll set it to /api)
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine
# send logs to docker
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
 && ln -sf /dev/stderr /var/log/nginx/error.log

# nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# static assets
COPY --from=build /app/dist/ /usr/share/nginx/html/