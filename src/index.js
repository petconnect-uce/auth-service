require('dotenv').config(); // Cargar variables de entorno

const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Conexión a MongoDB
connectDB();

// Middleware
app.use(express.json());

// Health-check
app.get('/health', (req, res) => res.status(200).send('OK'));

// Rutas principales
app.use('/api/v1/auth', authRoutes);

// Iniciar servidor
app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});
