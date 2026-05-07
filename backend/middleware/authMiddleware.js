export const requireAuth = (req, res, next) => {
  if (!req.session?.userId && !req.session?.tokens) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }
  next();
};
