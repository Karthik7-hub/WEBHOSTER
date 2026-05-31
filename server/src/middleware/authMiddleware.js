const authSessions = require('../security/authSessions');

/**
 * Express middleware to restrict operations to authenticated admins.
 */
async function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Required: Missing or invalid token header.',
      });
    }

    const token = authHeader.split(' ')[1];
    const session = await authSessions.isValidSession(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Exception: Session has expired or is invalid. Please log in again.',
      });
    }

    // Token is valid, proceed with enriched request context
    req.username = session.username;
    next();
  } catch (error) {
    console.error('Error in requireAdminAuth middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal authentication error occurred.',
    });
  }
}

module.exports = requireAdminAuth;
