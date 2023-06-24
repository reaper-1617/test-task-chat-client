FROM nginx:latest
COPY index.html /usr/share/nginx/html
COPY websocket.js /usr/share/nginx/html
