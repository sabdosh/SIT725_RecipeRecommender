FROM node:18-alpine
WORKDIR /app

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

WORKDIR /app
COPY server ./server
COPY client ./client

EXPOSE 3000
WORKDIR /app/server
CMD ["node", "server.js"]
