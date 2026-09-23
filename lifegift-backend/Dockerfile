FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY swagger-output.json ./swagger-output.json
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start"]
