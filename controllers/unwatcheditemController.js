const { User, Item, WatchedItem } = require('../models');
const { Op } = require('sequelize'); // Don't forget to import Op!

/**
 * @desc    Get all unwatched items for a specific user
 * @route   GET /users/:email/un_watched_item
 * @access  Private (or Public, depending on your auth)
 */
const getUnwatchedItems = async (req, res) => {
  try {
    // 1. Find the user by their primary key (email)
    const user = await User.findByPk(req.params.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Find all items that the user HAS watched
    // Uses the association defined in the WatchedItem model
    // Since your association is named 'WatchedItems', use the correct magic method
    const watchedItems = await user.getWatchedItems({ 
      // 'getWatchedItems' comes from the 'as: "WatchedItems"' option in your association
      joinTableAttributes: [] // This excludes the join table attributes from the result
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
};

module.exports = {
  getUnwatchedItems
};