FROM nginx:1.25-alpine

# Copy the entire game to nginx web root
COPY . /usr/share/nginx/html/

# Remove dev files that shouldn't be served
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/docker-compose.yml /usr/share/nginx/html/game-patch2.py

# Nginx config for SPA (serve index.html for all routes)
RUN echo 'server { listen 80; server_name localhost; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf)$ { expires 1y; add_header Cache-Control "public, immutable"; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
