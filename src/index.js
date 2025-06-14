require('dotenv').config(); // Cargar variables de entorno

const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

// Conexión a la base de datos
connectDB();

// Middleware
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);

// Iniciar servidor
app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});
