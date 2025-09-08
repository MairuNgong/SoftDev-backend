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


router.get('/:email/un_watched_item', async (req, res) => {
  try {
    // 1. Find the user by their primary key (email)
    const user = await User.findByPk(req.params.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Find all items that the user HAS watched
    // This uses the association through the WatchedItem model
    const watchedItems = await user.getItems({
      through: { model: WatchedItem }
      // If your association is named differently, use that instead of 'getItems'
      // e.g., if the association is named 'watched', you would use user.getWatched()
    });

    // 3. Extract only the IDs of the watched items for the next query
    const watchedItemIds = watchedItems.map(item => item.id);

    // 4. Find all items that are NOT in the watchedItemIds array
    const unwatchedItems = await Item.findAll({
      where: {
        id: {
          [Op.notIn]: watchedItemIds // Using the Sequelize Op.notIn operator
        }
      }
    });

    // 5. Send the list of unwatched items back to the client
    res.json(unwatchedItems);

  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error("Error fetching unwatched items:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;