// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  fullName: { type: String, required: true }, // 👈 Agregado
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['usuario', 'refugio', 'admin'], default: 'usuario' }
}, { timestamps: true }); // 👈 útil para saber cuándo fue creado el usuario

module.exports = mongoose.model('User', userSchema);
