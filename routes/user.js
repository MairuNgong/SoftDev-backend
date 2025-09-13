
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const { requireAuth, tryAuth } = require('../middleware/auth');

// router.get('/', userController.getAllUsers);
router.get('/:email', tryAuth, userController.getUserByEmail);
router.put('/:email', requireAuth, userController.updateUser);
// router.delete('/:email', userController.deleteUser);
router.get('/profile/:email', tryAuth, profileController.profile);

//Move /unwatcheditem to item

module.exports = router;