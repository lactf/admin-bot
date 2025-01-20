FROM node:23-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y dbus dbus-x11

COPY .puppeteerrc.cjs package.json package-lock.json ./
RUN npm ci && npm cache clean --force
RUN npx puppeteer browsers install chrome --install-deps

COPY . .

ENV PORT=8080

ARG RECAPTCHA_SITE
ENV RECAPTCHA_SITE=${RECAPTCHA_SITE}
ARG RECAPTCHA_SECRET
ENV RECAPTCHA_SECRET=${RECAPTCHA_SECRET}

USER node
CMD ["node", "index.js"]
