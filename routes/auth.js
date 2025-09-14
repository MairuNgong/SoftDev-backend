const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get("/", authController.loginPage);

router.get("/google", authController.googleAuth);

router.get('/google/callback', authController.googleCallback);


module.exports = router;