const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const authSessions = require('../security/authSessions');
const User = require('../models/User');

/**
 * Controller to handle administrative user login.
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Username and password are required.',
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      // Delay response slightly to mitigate basic brute force/timing attacks
      await new Promise((resolve) => setTimeout(resolve, 800));
      return res.status(401).json({
        success: false,
        error: 'Authentication Exception: Invalid username or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Delay response slightly to mitigate basic brute force/timing attacks
      await new Promise((resolve) => setTimeout(resolve, 800));
      return res.status(401).json({
        success: false,
        error: 'Authentication Exception: Invalid username or password.',
      });
    }

    // Generate a highly secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Register token in our MongoDB session manager
    await authSessions.addSession(token, user.username);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful!',
      data: {
        username: user.username,
        token,
      },
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
    const session = await authSessions.isValidSession(token);

    return res.status(200).json({
      success: true,
      isValid: !!session,
      username: session ? session.username : null,
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
      await authSessions.removeSession(token);
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

/**
 * Controller to update administrative credentials.
 */
async function updateCredentials(req, res) {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Current password is required to verify changes.',
      });
    }

    // req.username is set by the requireAdminAuth middleware
    const user = await User.findOne({ username: req.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Authentication Exception: Current password does not match.',
      });
    }

    const oldUsername = user.username;

    if (newUsername && newUsername.trim()) {
      const trimmedUsername = newUsername.trim();
      const existingUser = await User.findOne({ username: trimmedUsername });
      if (existingUser && existingUser.username !== oldUsername) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error: New username is already taken.',
        });
      }

      // Update all active session documents for this user
      const Session = require('../models/Session');
      await Session.updateMany({ username: oldUsername }, { username: trimmedUsername });

      user.username = trimmedUsername;
    }

    if (newPassword && newPassword.trim()) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword.trim(), salt);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Credentials updated successfully.',
      data: {
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Error updating credentials:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update credentials.',
    });
  }
}

module.exports = {
  login,
  verify,
  logout,
  updateCredentials,
};
