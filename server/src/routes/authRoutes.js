const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication API Endpoints
router.post('/login', authController.login);
router.get('/verify', authController.verify);
router.post('/logout', authController.logout);

module.exports = router;
