// Role-based middleware to ensure user is an organizer
module.exports.requireOrganizer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ message: 'Organizer role required' });
  }
  return next();
};
