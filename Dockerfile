FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --no-cache --prefer-online

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["node", "node_modules/ts-node/dist/bin.js", "-r", "tsconfig-paths/register", "src/index.ts"]