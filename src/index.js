require('dotenv').config(); // <--- Esto carga las variables del .env

const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Conexión a MongoDB
connectDB();

// Middlewares
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);

// Levantar servidor
app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});
