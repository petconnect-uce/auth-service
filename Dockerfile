# Usa imagen oficial de Node.js
FROM node:20

# Crea directorio de trabajo
WORKDIR /usr/src/app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto 3000
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
