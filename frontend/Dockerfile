FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_AUTH_URL=http://localhost:3000
ARG VITE_AUTH_CALLBACK_URL=http://localhost:3100/auth/callback
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_AUTH_CALLBACK_URL=$VITE_AUTH_CALLBACK_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
