const { Op, fn, col, where: sqlWhere } = require('sequelize');
const sequelize = require('../config/db');
const { User, Item, ItemCatagory } = require('../models');

/**
 * @desc    Get all unwatched items for a specific user (fallback: random items)
 * @route   GET /items/un_watched_item
 * @access  Public (tryAuth)
 */
exports.getUnwatchedItems = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      const randomItems = await Item.findAll({
        order: [[sequelize.fn('RANDOM')]],
        limit: 10
      });
      return res.json(randomItems);
    }

    const user = await User.findByPk(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const watchedItems = await user.getWatchedItems({ joinTableAttributes: [] });
    const watchedItemIds = watchedItems.map(i => i.id);

    const unwatchedItems = await Item.findAll({
      where: { id: { [Op.notIn]: watchedItemIds } },
      order: [['createdAt', 'DESC']]
    });

    return res.json(unwatchedItems);
  } catch (error) {
    console.error('Error fetching unwatched items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @desc    Search/filter items by category list (AND) and keyword in name/description.
 *          Body JSON: { categories?: string[], keyword?: string, status?, ownerEmail? }
 * @route   POST /items/search
 * @access  Public (tryAuth)
 */
exports.searchByCategoryAndKeyword = async (req, res) => {
  try {
    const { categories = [], keyword = '', status, ownerEmail } = req.body || {};

    // Base filters on Item
    const whereItem = {};
    if (status) whereItem.status = status;
    if (ownerEmail) whereItem.ownerEmail = ownerEmail;

    // Keyword (case-insensitive) on name/description
    if (keyword && keyword.trim()) {
      const kw = `%${keyword.trim().toLowerCase()}%`;
      whereItem[Op.or] = [
        sqlWhere(fn('LOWER', col('Item.name')), { [Op.like]: kw }),
        sqlWhere(fn('LOWER', col('Item.description')), { [Op.like]: kw })
      ];
    }

    // Build include if categories provided
    const include = [];
    if (Array.isArray(categories) && categories.length > 0) {
      include.push({
        model: ItemCatagory,                    // assumes: Item.hasMany(ItemCatagory)
        // omit 'as' to avoid alias mismatch; use the default association
        where: { categoryName: { [Op.in]: categories } },
        required: true
      });
    }

    const items = await Item.findAll({
      where: whereItem,
      include,
      distinct: true,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ items });
  } catch (err) {
    console.error('searchByCategoryAndKeyword error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


/**
 * @desc    Get all unwatched items for a specific user, excluding items in active trades
 * @param   {string} email - The user's email address
 * @param   {Array} itemList - Optional list of items to filter from
 * @return  {Promise<Array>} - Array of available unwatched items
 */

exports.getAvailableUnwatchedItems = async (req, res) => {
  try {
    const { email } = req.query; // Assuming email comes from query parameters

    // If no email provided, return random available items
    if (!email) {
      const randomItems = await Item.findAll({
        where: {
          // Exclude items that are in 'Matching' or 'Complete' trades
          id: {
            [Op.notIn]: sequelize.literal(`(
              SELECT DISTINCT ti."itemId" 
              FROM "TradeItems" ti
              JOIN "TradeTransactions" tt ON ti."transactionId" = tt.id
              WHERE tt.status IN ('Matching', 'Complete')
            )`)
          }
        },
        order: [[sequelize.fn('RANDOM')]],
        limit: 10
      });
      return res.status(200).json(randomItems);
    }

    // Find user by email
    const user = await User.findByPk(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get watched items from database
    const watchedItems = await user.getWatchedItems({ joinTableAttributes: [] });
    const watchedItemIds = watchedItems.map(i => i.id);

    // Find items that are: 
    // 1. NOT watched by user
    // 2. NOT in active trades  
    // 3. NOT owned by the current user
    const availableUnwatchedItems = await Item.findAll({
      where: {
        [Op.and]: [
          // Exclude watched items
          { id: { [Op.notIn]: watchedItemIds } },
          // Exclude items in active trades
          { id: { [Op.notIn]: sequelize.literal(`(
            SELECT DISTINCT ti."itemId" 
            FROM "TradeItems" ti
            JOIN "TradeTransactions" tt ON ti."transactionId" = tt.id
            WHERE tt.status IN ('Matching', 'Complete')
          )`) } },
          // Exclude user's own items
          { ownerEmail: { [Op.ne]: email } }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: 10 // Added limit to return only 10 items
    });

    return res.status(200).json(availableUnwatchedItems);
    
  } catch (error) {
    console.error('Error in getAvailableUnwatchedItems:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};