# Auth Service – PetConnect 🐾

Servicio de autenticación para la plataforma PetConnect.

## 📌 Descripción

Este microservicio se encarga de:
- Registrar nuevos usuarios (`/register`)
- Autenticar usuarios (`/login`)
- Generar tokens JWT
- Proteger rutas según rol (`usuario`, `refugio`, `admin`)

## 🚀 Tecnologías

- Node.js
- Express.js
- MongoDB (vía Mongoose)
- JSON Web Tokens (JWT)
- Docker

## 🔐 Variables de entorno

```env
PORT=3000
MONGODB_URI=mongodb://mongo:27017/authdb
JWT_SECRET=supersecreto123diegopetconnect456
