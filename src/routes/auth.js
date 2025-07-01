const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const authorizeRoles = require('../middleware/roleMiddleware.js');

// Conexión a Redis
const redisClient = redis.createClient({ url: 'redis://redis:6379' });
redisClient.connect().catch(console.error);

// === Registration ===
router.post('/register', [...], async (req, res) => {
  // mismo código de registro que ya tienes
});

// === Login con refresh token ===
router.post('/login', [...], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

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
    await redisClient.setEx(user._id.toString(), 7 * 24 * 60 * 60, refreshToken); // TTL 7 días

    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === Refresh Token ===
router.post('/refresh-token', async (req, res) => {
  const { userId, refreshToken } = req.body;

  if (!userId || !refreshToken) {
    return res.status(400).json({ message: 'Missing refresh token or userId' });
  }

  try {
    const storedToken = await redisClient.get(userId);
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

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

// === Protected routes ===
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
