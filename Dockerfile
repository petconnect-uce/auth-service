# Usa una imagen base oficial de Node.js
FROM node:20

# Crea y usa el directorio de la app dentro del contenedor
WORKDIR /app

# Copia los archivos de package y package-lock para instalar deps primero
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto de la app
EXPOSE 3000

# Comando para iniciar el microservicio
CMD ["npm", "start"]
