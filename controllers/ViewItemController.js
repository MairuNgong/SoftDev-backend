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
