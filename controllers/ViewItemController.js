const { Op } = require('sequelize');
const { User, Item, ItemCatagory, ItemPicture } = require('../models');
const { formatItem, BaseFilter } = require('../utils/itemFilter');

/**
 * @desc Get all unwatched items for a specific user (fallback: random items)
 * @route GET /items/un_watched_item
 * @access Public (tryAuth)
 */

exports.searchByCategoryAndKeyword = async (req, res) => {
  try {
    const { keyword, categories } = req.body || {};

    // keyword filter
    const whereItem = {};
    if (keyword && String(keyword).trim()) {
      const k = String(keyword).trim();
      whereItem[Op.or] = [{ name: { [Op.iLike]: `%${k}%` } }];
    }

    // helper: latest picture
    const includeLatestPicture = {
      model: ItemPicture,
      attributes: ['imageLink', 'createdAt'],
      limit: 1,
      order: [['createdAt', 'DESC']],
      separate: true
    };

    let items = [];
    const hasCategories =
      Array.isArray(categories) &&
      categories.map(s => String(s).trim()).filter(Boolean).length > 0;

    if (hasCategories) {
      const list = categories.map(s => String(s).trim()).filter(Boolean);

      // step 1: find matching item IDs
      const matchedRows = await Item.findAll({
        where: whereItem,
        attributes: ['id'],
        include: [
          {
            model: ItemCatagory,
            attributes: [],
            where: { categoryName: { [Op.in]: list } },
            required: true
          }
        ],
        raw: true
      });

      const ids = matchedRows.map(r => r.id);
      if (ids.length === 0) {
        return res.status(200).json({ items: [] });
      }

      // step 2: fetch all categories + pictures for matched items
      items = await Item.findAll({
        where: { ...whereItem, id: { [Op.in]: ids } },
        include: [
          { model: ItemCatagory, attributes: ['id', 'categoryName'], required: false },
          includeLatestPicture
        ],
        distinct: true,
        order: [['createdAt', 'DESC']]
      });
    } else {
      // no category filter
      items = await Item.findAll({
        where: whereItem,
        include: [
          { model: ItemCatagory, attributes: ['id', 'categoryName'], required: false },
          includeLatestPicture
        ],
        distinct: true,
        order: [['createdAt', 'DESC']]
      });
    }

    const formatted = items.map(formatItem);
    const filteredItems = await BaseFilter(formatted, req.user);

    // Step 4: Return filtered items
    return res.status(200).json({ items: filteredItems });

  } catch (err) {
    console.error('searchByCategoryAndKeyword error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAvailableUnwatchedItems = async (req, res) => {
  try {
    // Guest (no login)
    if (!req.user || !req.user.email) {
      const randomItems = await Item.findAll({
        order: [[Item.sequelize.fn('RANDOM')]],
        limit: 10
      });
      const formatted = randomItems.map(formatItem);
      const filtered = await BaseFilter(formatted, null);
      return res.status(200).json(filtered);
    }

    const user = await User.findByPk(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get watched item IDs
    const watchedItems = await user.getWatchedItems({ joinTableAttributes: [] });
    const watchedItemIds = watchedItems.map(i => i.id);

    // Fetch unwatched items
    let availableUnwatchedItems = await Item.findAll({
      where: { id: { [Op.notIn]: watchedItemIds } },
      order: [['createdAt', 'DESC']]
    });

    let formatted = availableUnwatchedItems.map(formatItem);
    let filtered = await BaseFilter(formatted, req.user);

    // If no items left → reset watched items and re-fetch
    if (filtered.length === 0) {
      await user.setWatchedItems([]);
      const resetItems = await Item.findAll({
        order: [['createdAt', 'DESC']]
      });
      formatted = resetItems.map(formatItem);
      filtered = await BaseFilter(formatted, req.user);
    }

    return res.status(200).json({ items: filtered.slice(0, 10) });
  } catch (error) {
    console.error('Error in getAvailableUnwatchedItems:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

