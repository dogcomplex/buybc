
# build stage
FROM node:lts-alpine3.12 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# build app for production with minification
RUN npm run build --prod

# production stage
FROM nginx:stable-alpine as production-stage
WORKDIR /root/
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]