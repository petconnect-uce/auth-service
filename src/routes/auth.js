const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const redis = require('redis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const authorizeRoles = require('../middleware/roleMiddleware.js');

const redisClient = redis.createClient({ url: 'redis://redis:6379' });
redisClient.connect().catch(console.error);

// === Registro de usuarios ===
router.post(
  '/register',
  [
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
      .matches(/^[a-zA-Z0-9]+$/).withMessage('Only letters and numbers allowed'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/).withMessage('Must include lowercase letter')
      .matches(/[A-Z]/).withMessage('Must include uppercase letter')
      .matches(/\d/).withMessage('Must include a number')
      .matches(/[^a-zA-Z0-9]/).withMessage('Must include a special character'),
    body('role')
      .optional()
      .isIn(['usuario', 'refugio']).withMessage('Role must be "usuario" or "refugio"'),
    body('fullName')
      .notEmpty().withMessage('Full name is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password, role, fullName } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({ username, email, password: hashedPassword, role: role || 'usuario' });
      await user.save();

      // Llamar a registration-service
      await axios.post('http://registration-service:8082/api/v1/registration/register', {
        fullName,
        email,
        password,
        authUserId: user._id.toString()
      });

      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(201).json({ token: accessToken, userId: user._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// === Login ===
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .notEmpty().withMessage('Password required')
      .isLength({ min: 8 }).withMessage('Min 8 characters')
      .matches(/[A-Z]/i).withMessage('At least one letter')
      .matches(/[0-9]/).withMessage('At least one number')
      .matches(/[^A-Za-z0-9]/).withMessage('At least one special character'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const refreshToken = uuidv4();
      await redisClient.setEx(user._id.toString(), 7 * 24 * 60 * 60, refreshToken);

      res.status(200).json({ accessToken, refreshToken, userId: user._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// === Refresh Token ===
router.post('/refresh-token', async (req, res) => {
  const { userId, refreshToken } = req.body;
  if (!userId || !refreshToken) return res.status(400).json({ message: 'Missing refresh token or userId' });

  try {
    const storedToken = await redisClient.get(userId);
    if (!storedToken || storedToken !== refreshToken) return res.status(403).json({ message: 'Invalid refresh token' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === Logout ===
router.post('/logout', async (req, res) => {
  const { userId } = req.body;
  try {
    await redisClient.del(userId);
    res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === Rutas protegidas ===
router.get('/profile', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Access allowed to protected route', user: req.user });
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