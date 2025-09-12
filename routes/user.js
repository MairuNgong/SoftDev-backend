
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');

// router.get('/', userController.getAllUsers);
router.get('/:email', userController.getUserByEmail);
router.put('/:email', userController.updateUser);
// router.delete('/:email', userController.deleteUser);
router.get('/profile/:email', profileController.profile);
module.exports = router;