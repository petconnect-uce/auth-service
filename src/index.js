require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json({ limit: '1mb' }));


// Middleware CORS global
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // En producción puedes restringir a tus dominios
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Conexión a MongoDB
connectDB();

// Conexión a Redis con manejo de errores críticos
redisClient.connect()
  .then(() => {
    console.log('✅ Redis conectado');
  })
  .catch(err => {
    console.error('❌ Error al conectar con Redis:', err.message);
    process.exit(1); // Termina el proceso si Redis no está disponible
  });

// Endpoint de salud para monitoreo
app.get('/health', (_, res) => res.status(200).send('OK'));

// Rutas principales del servicio
app.use('/api/v1/auth', authRoutes);

// Middleware para rutas no encontradas
app.use((_, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en auth-service' });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Auth service corriendo en el puerto ${port}`);
});
