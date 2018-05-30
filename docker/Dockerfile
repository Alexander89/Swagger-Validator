FROM nginx:latest

RUN apt update && apt-get install nginx-extras -y
RUN rm -rf /usr/share/nginx/html/*

COPY ./docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY ./dist /usr/share/nginx/html
COPY ./docker/nginx/robots.txt /usr/share/nginx/html/robots.txt

RUN nginx -t
