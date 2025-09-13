
const express = require('express');
const router = express.Router();

const { User, Item, WatchedItem } = require('../models');



router.get('/', async (req, res) => {
  const users = await User.findAll();  // Sequelize method to get all records
  res.json(users);
});

router.get('/:email', async (req, res) => {
  const user = await User.findByPk(req.params.email);  // Find by primary key
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/:email', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update(req.body);  // Sequelize method to update record
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:email', async (req, res) => {
  const user = await User.findByPk(req.params.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.destroy();  // Sequelize method to delete record
  res.json({ message: 'User deleted' });
});




const { getUnwatchedItems } = require('../controllers/unwatcheditemController');
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');

// router.get('/', userController.getAllUsers);
router.get('/:email', userController.getUserByEmail);
router.put('/:email', userController.updateUser);
// router.delete('/:email', userController.deleteUser);
router.get('/profile/:email', profileController.profile);
router.get('/:email/un_watched_item', getUnwatchedItems);

module.exports = router;