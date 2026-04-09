# ── build ─────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Подставьте при сборке: docker build --build-arg REACT_APP_API_URL=https://api.example.com .
ARG REACT_APP_API_URL
ARG REACT_APP_CRM_API_URL
ARG REACT_APP_EMAIL_INTEGRATION_API_URL
ARG REACT_APP_OAUTH_CLIENT_ID
ARG REACT_APP_OAUTH_REDIRECT_URI

ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_CRM_API_URL=$REACT_APP_CRM_API_URL \
    REACT_APP_EMAIL_INTEGRATION_API_URL=$REACT_APP_EMAIL_INTEGRATION_API_URL \
    REACT_APP_OAUTH_CLIENT_ID=$REACT_APP_OAUTH_CLIENT_ID \
    REACT_APP_OAUTH_REDIRECT_URI=$REACT_APP_OAUTH_REDIRECT_URI

RUN npm run build

# ── runtime ───────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
