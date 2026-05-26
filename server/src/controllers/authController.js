const crypto = require('crypto');
const authSessions = require('../security/authSessions');
const config = require('../config/config');

/**
 * Controller to handle administrative user login.
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    const systemUser = config.admin.username;
    const systemPass = config.admin.password;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Username and password are required.',
      });
    }

    if (username === systemUser && password === systemPass) {
      // Generate a highly secure random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Register token in our in-memory session manager
      authSessions.addSession(token, username);

      return res.status(200).json({
        success: true,
        message: 'Authentication successful!',
        data: {
          username,
          token,
        },
      });
    }

    // Delay response slightly to mitigate basic brute force/timing attacks
    await new Promise((resolve) => setTimeout(resolve, 800));

    return res.status(401).json({
      success: false,
      error: 'Authentication Exception: Invalid username or password.',
    });
  } catch (error) {
    console.error('Error in auth login controller:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during login.',
    });
  }
}

/**
 * Controller to verify if a stored token is still active and valid.
 */
async function verify(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ success: false, isValid: false });
    }

    const token = authHeader.split(' ')[1];
    const isValid = authSessions.isValidSession(token);

    return res.status(200).json({
      success: true,
      isValid,
    });
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify session token status.',
    });
  }
}

/**
 * Controller to handle administrative user logout.
 */
async function logout(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      authSessions.removeSession(token);
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out.',
    });
  } catch (error) {
    console.error('Error in logout controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process logout.',
    });
  }
}

module.exports = {
  login,
  verify,
  logout,
};
