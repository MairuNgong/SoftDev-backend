// controllers/ViewItemController.js
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { User, Item, ItemCatagory } = require('../models');

/**
 * @desc Get all unwatched items for a specific user (fallback: random items)
 * @route GET /items/un_watched_item
 * @access Public (tryAuth)
 */
exports.getUnwatchedItems = async (req, res) => {
  try {
    // If not logged in, just return random items
    if (!req.user || !req.user.email) {
      const randomItems = await Item.findAll({
        order: [[sequelize.fn('RANDOM')]],
        limit: 10,
        include: [
          { model: ItemCatagory, attributes: ['id', 'categoryName'] }
        ]
      });
      return res.json(randomItems);
    }

    // Logged-in: exclude items the user has already watched
    const user = await User.findByPk(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const watchedItems = await user.getWatchedItems({ joinTableAttributes: [] });
    const watchedItemIds = watchedItems.map(i => i.id);

    const unwatchedItems = await Item.findAll({
      where: { id: { [Op.notIn]: watchedItemIds } },
      order: [['createdAt', 'DESC']],
      include: [
        { model: ItemCatagory, attributes: ['id', 'categoryName'] }
      ]
    });

    return res.json(unwatchedItems);
  } catch (error) {
    console.error('Error fetching unwatched items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

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
