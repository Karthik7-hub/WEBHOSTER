const Session = require('../models/Session');

/**
 * Registers a new session with an active token in MongoDB.
 */
async function addSession(token, username) {
  return await Session.create({ token, username });
}

/**
 * Validates whether an incoming token matches an active session.
 * Returns the session document if valid, and null otherwise.
 */
async function isValidSession(token) {
  if (!token) {
    return null;
  }
  // MongoDB TTL index handles automatic removal of expired sessions.
  return await Session.findOne({ token });
}

/**
 * Revokes a session token immediately on logout.
 */
async function removeSession(token) {
  if (token) {
    await Session.deleteOne({ token });
  }
}

module.exports = {
  addSession,
  isValidSession,
  removeSession,
};
