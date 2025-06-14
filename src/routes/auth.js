const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js'); // Asegúrate que este path sea correcto
const { body, validationResult } = require('express-validator'); //  validaciones
const allowedRoles = ['usuario', 'refugio', 'admin'];
const authMiddleware = require('../middleware/authMiddleware.js');
const authorizeRoles = require('../middleware/roleMiddleware.js');


// Registro
router.post(
  '/register',
  [
    body('username')
      .notEmpty().withMessage('El nombre de usuario es obligatorio')
      .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres')
      .matches(/^[a-zA-Z0-9]+$/).withMessage('Solo se permiten letras y números'),

    body('email')
      .isEmail().withMessage('Correo electrónico inválido'),

    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/[a-z]/).withMessage('Debe contener al menos una letra minúscula')
      .matches(/[A-Z]/).withMessage('Debe contener al menos una letra mayúscula')
      .matches(/\d/).withMessage('Debe contener al menos un número')
      .matches(/[^a-zA-Z0-9]/).withMessage('Debe contener al menos un carácter especial'),

    body('role')
      .optional()
      .isIn(['usuario', 'refugio']).withMessage('El rol debe ser "usuario" o "refugio"')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    try {
      const { username, email, password, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: 'El usuario ya existe' });

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: role || 'usuario'
      });

      await user.save();

      console.log('Usuario guardado:', user);

      res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
);



// LOGIN

// LOGIN
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Email inválido'),
    body('password')
      .notEmpty()
      .withMessage('La contraseña es obligatoria')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/[A-Z]/i)
      .withMessage('Debe contener al menos una letra')
      .matches(/[0-9]/)
      .withMessage('Debe contener al menos un número')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Debe contener al menos un carácter especial')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
);



// Ruta protegida para usuarios autenticados
router.get('/profile', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Access allowed to protected route',
    user: req.user,
  });
});


// Ruta solo para admins
router.get('/admin-only', authMiddleware, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({ message: 'Access allowed for admin', user: req.user });
});

// Ruta solo para refugios
router.get('/refugio-only', authMiddleware, authorizeRoles('refugio'), (req, res) => {
  res.status(200).json({ message: 'Access allowed for shelter', user: req.user });
});

// Ruta solo para usuarios normales
router.get('/usuario-only', authMiddleware, authorizeRoles('usuario'), (req, res) => {
  res.status(200).json({ message: 'Access allowed for user', user: req.user });
});


module.exports = router;



