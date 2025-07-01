require('dotenv').config(); // Variables de entorno

const express = require('express');
const connectDB = require('./config/db');
const redisClient = require('./config/redis'); // conexión redis
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

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

// Health-check
app.get('/health', (req, res) => res.status(200).send('OK'));

// Rutas principales
app.use('/api/v1/auth', authRoutes);

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en auth-service' });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Auth service corriendo en el puerto ${port}`);
});
