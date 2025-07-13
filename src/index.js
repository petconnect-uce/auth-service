require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Middleware CORS global (opcional pero recomendado)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Conexión a MongoDB
connectDB();

// Conexión a Redis
redisClient.connect()
  .then(() => {
    console.log('✅ Redis conectado');
  })
  .catch(err => {
    console.error('❌ Error al conectar con Redis:', err);
  });

// Endpoint de salud
app.get('/health', (req, res) => res.status(200).send('OK'));

// Rutas de autenticación
app.use('/api/v1/auth', authRoutes);

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en auth-service' });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Auth service corriendo en el puerto ${port}`);
});
