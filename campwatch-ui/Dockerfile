FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Vite inlines VITE_* env vars at build time. These must be provided as
# --build-arg (wired via docker-compose build.args) or the hero image key is
# undefined and the UI silently falls back to the gradient. See issue #203.
ARG VITE_CAMPWATCH_API_URL=""
ARG VITE_UNSPLASH_KEY=""
ARG VITE_HERO_QUERY="primitive tent camping forest wilderness"
ARG VITE_APP_NAME="Moondock"
ENV VITE_CAMPWATCH_API_URL=$VITE_CAMPWATCH_API_URL \
    VITE_UNSPLASH_KEY=$VITE_UNSPLASH_KEY \
    VITE_HERO_QUERY=$VITE_HERO_QUERY \
    VITE_APP_NAME=$VITE_APP_NAME

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
