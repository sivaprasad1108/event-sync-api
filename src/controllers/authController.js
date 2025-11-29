const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const usersStore = require('../data/usersStore');
const jwtService = require('../services/jwtService');

// Helper to remove sensitive fields
const sanitizeUser = (user) => {
  const { passwordHash, ...rest } = user;
  return rest;
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }
    if (!['organizer', 'attendee'].includes(role)) {
      return res.status(400).json({ message: 'role must be either organizer or attendee' });
    }

    const existing = usersStore.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name,
      email,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };

    usersStore.createUser(user);
    const token = jwtService.signToken({ userId: user.id, role: user.role, email: user.email });

    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = usersStore.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwtService.signToken({ userId: user.id, role: user.role, email: user.email });
    return res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
};
