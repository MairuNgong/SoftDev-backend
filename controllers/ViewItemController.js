const { User, Item, WatchedItem } = require('../models');
const sequelize = require('../config/db');
const { Op } = require('sequelize'); // Don't forget to import Op!

/**
 * @desc    Get all unwatched items for a specific user
 * @route   GET /users/:email/un_watched_item
 * @access  Private (or Public, depending on your auth)
 */
exports.getUnwatchedItems = async (req, res) => {
  try {

    if (!req.user || !req.user.email) {
      const randomItems = await Item.findAll({
        order: [ [sequelize.fn('RANDOM')] ],
        limit: 10
      });
      return res.json(randomItems);
    }
    // Find the user by their primary key (email)
    const user = await User.findByPk(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all items that the user HAS watched
    const watchedItems = await user.getWatchedItems({
      joinTableAttributes: []
    });

    // Extract only the IDs of the watched items
    const watchedItemIds = watchedItems.map(item => item.id);

    // Find all items that are NOT in the watchedItemIds array
    const unwatchedItems = await Item.findAll({
      where: {
        id: {
          [Op.notIn]: watchedItemIds
        }
      }
    });

    res.json(unwatchedItems);

  } catch (error) {
    console.error("Error fetching unwatched items:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
