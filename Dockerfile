FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY index.js bot53.mjs core53.js media53.mjs alwaysreply53.mjs mesh53.mjs ./
ENV NODE_ENV=production BOT_INPROC=1 BRIDGE_FORWARD_INBOUND=0 TYPING_MS=1000 PHONE_NUMBER_ID_53=1364570600073371
EXPOSE 10000
CMD ["node", "index.js"]
