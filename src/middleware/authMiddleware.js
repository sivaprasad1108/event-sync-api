const jwtService = require('../services/jwtService');

// Middleware to authenticate requests using Authorization: Bearer <token>
module.exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwtService.verifyToken(token);
    // Attach basic user info extracted from token payload
    req.user = {
      id: payload.userId,
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
