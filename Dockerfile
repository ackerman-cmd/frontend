# ── build ─────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# ARG-переменные доступны в RUN если переданы через --build-arg.
# ENV-инструкция намеренно отсутствует: пустой ARG ставил бы "" в process.env
# и перебивал .env.production. Без ENV непереданный ARG просто не попадает
# в process.env, и CRA штатно читает .env.production.
ARG REACT_APP_API_URL
ARG REACT_APP_CRM_API_URL
ARG REACT_APP_EMAIL_INTEGRATION_API_URL
ARG REACT_APP_REPORT_API_URL
ARG REACT_APP_OAUTH_CLIENT_ID
ARG REACT_APP_OAUTH_REDIRECT_URI

RUN npm run build

# ── runtime ───────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
