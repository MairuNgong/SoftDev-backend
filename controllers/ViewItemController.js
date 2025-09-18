// controllers/ViewItemController.js
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { User, Item, ItemCatagory } = require('../models');

/**
 * @desc Get all unwatched items for a specific user (fallback: random items)
 * @route GET /items/un_watched_item
 * @access Public (tryAuth)
 */


/**
 * @desc Search items by categories + keyword (both optional)
 * @route POST /items/search
 * @body  { keyword?: string, categories?: string[] }
 * @access Public (tryAuth)
 *
 * Behavior:
 *  - Always returns categories in results.
 *  - If "categories" provided, filters by those categoryName(s).
 *  - If "keyword" provided, matches name/description (ILIKE).
 */
exports.searchByCategoryAndKeyword = async (req, res) => {
  try {
    const { keyword, categories } = req.body || {};

    // Build WHERE for Item
    const whereItem = {};
    if (keyword && String(keyword).trim()) {
      const k = String(keyword).trim();
      whereItem[Op.or] = [
        { name: { [Op.iLike]: `%${k}%` } },
        { description: { [Op.iLike]: `%${k}%` } }
      ];
    }

    // Build INCLUDE for categories
    // We ALWAYS include categories in results.
    // If categories filter is provided, we add a where to the include and mark it required (INNER JOIN).
    let include = [];
    if (Array.isArray(categories) && categories.length > 0) {
      const list = categories
        .map(s => String(s).trim())
        .filter(Boolean);
      include.push({
        model: ItemCatagory,
        attributes: ['id', 'categoryName'],
        where: { categoryName: { [Op.in]: list } },
        required: true
      });
    } else {
      include.push({
        model: ItemCatagory,
        attributes: ['id', 'categoryName'],
        required: false
      });
    }

    const items = await Item.findAll({
      where: whereItem,
      include,
      distinct: true,
      order: [['createdAt', 'DESC']]
    });

    // NOTE: respond with { items } to match your existing route contract
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