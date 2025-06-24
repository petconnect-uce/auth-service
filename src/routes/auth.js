const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware.js');
const authorizeRoles = require('../middleware/roleMiddleware.js');

// Registration
router.post(
  '/register',
  [
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
      .matches(/^[a-zA-Z0-9]+$/).withMessage('Only letters and numbers are allowed'),

    body('email')
      .isEmail().withMessage('Invalid email address'),

    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/[a-z]/).withMessage('Must contain at least one lowercase letter')
      .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter')
      .matches(/\d/).withMessage('Must contain at least one number')
      .matches(/[^a-zA-Z0-9]/).withMessage('Must contain at least one special character'),

    body('role')
      .optional()
      .isIn(['usuario', 'refugio']).withMessage('Role must be "usuario" or "refugio"')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, email, password, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: role || 'usuario'
      });

      await user.save();

      console.log('User saved:', user);

      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Invalid email address'),

    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/i).withMessage('Must contain at least one letter')
      .matches(/[0-9]/).withMessage('Must contain at least one number')
      .matches(/[^A-Za-z0-9]/).withMessage('Must contain at least one special character')
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
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Protected routes
router.get('/profile', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Access allowed to protected route',
    user: req.user,
  });
});

router.get('/admin-only', authMiddleware, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({ message: 'Access allowed for admin', user: req.user });
});

router.get('/refugio-only', authMiddleware, authorizeRoles('refugio'), (req, res) => {
  res.status(200).json({ message: 'Access allowed for shelter', user: req.user });
});

router.get('/usuario-only', authMiddleware, authorizeRoles('usuario'), (req, res) => {
  res.status(200).json({ message: 'Access allowed for user', user: req.user });
});

module.exports = router;
