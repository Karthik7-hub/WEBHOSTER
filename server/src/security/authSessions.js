/**
 * In-memory registry for managing active authenticated dashboard sessions.
 */
const activeSessions = new Map(); // token -> { username, createdAt }

// Session validity lifespan: 24 hours (in milliseconds)
const SESSION_LIFESPAN = 24 * 60 * 60 * 1000;

/**
 * Registers a new session with an active token.
 */
function addSession(token, username) {
  activeSessions.set(token, {
    username,
    createdAt: Date.now(),
  });
}

/**
 * Validates whether an incoming token matches an active and non-expired session.
 */
function isValidSession(token) {
  if (!token || !activeSessions.has(token)) {
    return false;
  }

  const session = activeSessions.get(token);
  const isExpired = Date.now() - session.createdAt > SESSION_LIFESPAN;

  if (isExpired) {
    activeSessions.delete(token);
    return false;
  }

  return true;
}

/**
 * Revokes a session token immediately on logout.
 */
function removeSession(token) {
  if (token) {
    activeSessions.delete(token);
  }
}

module.exports = {
  addSession,
  isValidSession,
  removeSession,
};
