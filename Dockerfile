# Estágio de build
FROM node:20-alpine AS build

WORKDIR /app

# Instala dependências necessárias para build
RUN apk add --no-cache git python3 make g++ libc6-compat

# Copia os arquivos de configuração
COPY package*.json tsconfig.json ./

# Gera package-lock.json atualizado e instala dependências
RUN npm install && npm ci

# Copia o código fonte
COPY . .

# Compila o TypeScript
RUN npm run build

# Estágio de produção
FROM node:20-alpine

WORKDIR /app

# Instala dependências necessárias para produção
RUN apk add --no-cache git python3 make g++ libc6-compat

# Copia os arquivos de configuração
COPY package*.json ./

# Gera package-lock.json atualizado e instala apenas dependências de produção
RUN npm install --only=production && npm ci --only=production

# Copia os arquivos compilados e as migrations do estágio de build
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/infrastructure/database/migrations ./dist/infrastructure/database/migrations

# Cria diretórios necessários
RUN mkdir -p sessions \
    && mkdir -p dist/infrastructure/database/migrations

# Expõe a porta da aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "dist/app.js"]
