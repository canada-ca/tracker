FROM nginxinc/nginx-unprivileged:1.25-alpine3.17

RUN rm -rf /etc/nginx/html/*

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./html /usr/share/nginx/html

WORKDIR /app

#USER nginx

EXPOSE 8080

CMD ["nginx-debug", "-g", "daemon off;"]
