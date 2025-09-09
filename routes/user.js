
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.get('/:email', userController.getUserByEmail);
router.put('/:email', userController.updateUser);
router.delete('/:email', userController.deleteUser);

module.exports = router;