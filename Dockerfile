# Etapa 1: Construcción (instala dependencias)
FROM node:20-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia solo package.json y package-lock.json para aprovechar el cache de Docker
COPY package*.json ./

# Instala solo las dependencias de producción
RUN npm install --only=production

# Copia el resto del código
COPY . .

# Etapa 2: Imagen final
FROM node:20-alpine

WORKDIR /app

# Copia solo los archivos necesarios desde la etapa anterior
COPY --from=builder /app /app

# Expone el puerto de la app
EXPOSE 3000

# Comando de inicio
CMD ["node", "src/index.js"]
