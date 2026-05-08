/**
 * Role-based access middleware.
 * super_admin always passes through regardless of allowedRoles.
 */
export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // Super admin has universal access
    if (req.user.role === 'super_admin') return next();
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};
