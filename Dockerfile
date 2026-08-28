# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine
# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html/

# Nginx config for SPA and static assets
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    absolute_redirect off; \
    root /usr/share/nginx/html; \
    index index.html; \
    location = / { \
        return 302 /magic-type-quest/; \
    } \
    location ^~ /magic-type-quest/ { \
        rewrite ^/magic-type-quest/(.*)$ /$1 break; \
        try_files $uri $uri/ /index.html; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
