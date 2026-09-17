# Build
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy app and build here (cache optimal)
COPY . .
RUN npm run build

# Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
