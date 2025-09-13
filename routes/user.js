
const express = require('express');
const router = express.Router();
const { getUnwatchedItems } = require('../controllers/unwatcheditemController');
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const { requireAuth, tryAuth } = require('../middleware/auth');

// router.get('/', userController.getAllUsers);
router.get('/:email', tryAuth, userController.getUserByEmail);
router.put('/:email', requireAuth, userController.updateUser);
// router.delete('/:email', userController.deleteUser);
router.get('/profile/:email', tryAuth, profileController.profile);
router.get('/:email/un_watched_item', requireAuth, getUnwatchedItems);

module.exports = router;