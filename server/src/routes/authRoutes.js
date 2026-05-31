const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAdminAuth = require('../middleware/authMiddleware');

// Authentication API Endpoints
router.post('/login', authController.login);
router.get('/verify', authController.verify);
router.post('/logout', authController.logout);
router.put('/credentials', requireAdminAuth, authController.updateCredentials);

module.exports = router;
