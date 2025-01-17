/**
 * Middleware to restrict Auth to routes that require authentication
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 *
 */
export default async function restrictAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  return next();
}
