const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'supersecreto123'; // tu clave secreta

function jwtAuthenticationMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // para usar en el siguiente middleware o controlador
    next();
  } catch (err) {
    console.error('Invalid token:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = jwtAuthenticationMiddleware;
