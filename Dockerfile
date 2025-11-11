# -------- BACKEND (Node + Prisma) --------
FROM node:18-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN chmod +x ./start-app.sh

ENV NODE_ENV=production

CMD ["./start-app.sh"]
