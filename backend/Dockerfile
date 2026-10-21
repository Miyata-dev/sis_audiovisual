FROM node:22-slim

WORKDIR /app

RUN npm install -g npm@11

COPY package.json ./
RUN npm install

# 3. Copiamos el código
COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main"]