
# build stage
FROM node:lts-alpine3.12 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# build app for production with minification
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK CMD curl --fail http://localhost:8080 || exit 1
CMD [ "nginx", "-g", "daemon off;" ]