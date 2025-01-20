FROM node:23-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y dbus dbus-x11

COPY .puppeteerrc.cjs package.json package-lock.json ./
RUN npm ci && npm cache clean --force
RUN npx puppeteer browsers install chrome --install-deps

COPY index.js submit.html /app
RUN mkdir /app/handlers

ENV PORT=8080

USER node
CMD ["node", "index.js"]
