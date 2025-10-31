const { Op, Model } = require('sequelize');
const { User, Item, ItemCatagory, ItemPicture, InterestedCatagory } = require('../models');
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
          },
          { model: User, attributes: ['RatingScore'] }
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
          includeLatestPicture,
          { model: User, attributes: ['RatingScore'] }
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
          includeLatestPicture,
          { model: User, attributes: ['RatingScore'] }
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

  const includeLatestPicture = {
    model: ItemPicture,
    attributes: ['imageLink', 'createdAt'],
    limit: 1,
    order: [['createdAt', 'DESC']],
    separate: true
  };

  try {
    // Guest (no login)
    if (!req.user || !req.user.email) {
      const randomItems = await Item.findAll({
        include: [
          { model: User, attributes: ['RatingScore', 'Location'] },
          { model: ItemCatagory, attributes: ['id', 'categoryName'], required: false },
          includeLatestPicture
        ],
        order: [[Item.sequelize.fn('RANDOM')]],
        limit: 10
      });
      const formatted = randomItems.map(formatItem);
      const filtered = await BaseFilter(formatted, null);
      return res.status(200).json(filtered);
    }

    const user = await User.findByPk(req.user.email, {
      include: { model: InterestedCatagory, attributes: ['categoryName'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get user's interested categories and location
    const interestedCategories = user.InterestedCategories.map(c => c.categoryName);
    const userLocation = user.Location;

    // Get watched item IDs
    const watchedItems = await user.getWatchedItems({ joinTableAttributes: [] });
    const watchedItemIds = watchedItems.map(i => i.id);

    // Fetch unwatched items with owner location
    let availableUnwatchedItems = await Item.findAll({
      where: { id: { [Op.notIn]: watchedItemIds } },
      include: [
        { model: User, attributes: ['RatingScore', 'Location'] },
        { model: ItemCatagory, attributes: ['id', 'categoryName'], required: false },
        includeLatestPicture
      ],
      order: [['createdAt', 'DESC']]
    });

    let formatted = availableUnwatchedItems.map(formatItem);
    let filtered = await BaseFilter(formatted, req.user);

    // Sort items by priority: category match first, then location match
    const sortedItems = filtered.sort((a, b) => {
      const aCategoryMatch = a.ItemCategories?.some(cat => interestedCategories.includes(cat)) ? 1 : 0;
      const bCategoryMatch = b.ItemCategories?.some(cat => interestedCategories.includes(cat)) ? 1 : 0;

      // Compare owner's location with user's location
      const aLocationMatch = a.ownerLocation === userLocation ? 1 : 0;
      const bLocationMatch = b.ownerLocation === userLocation ? 1 : 0;

      // Priority: category match > location match
      if (aCategoryMatch !== bCategoryMatch) return bCategoryMatch - aCategoryMatch;
      if (aLocationMatch !== bLocationMatch) return bLocationMatch - aLocationMatch;
      return 0;
    });

    // If no items left → reset watched items and re-fetch
    if (sortedItems.length === 0) {
      await user.setWatchedItems([]);
      const resetItems = await Item.findAll({
        include: [
          { model: User, attributes: ['RatingScore', 'Location'] },
          { model: ItemCatagory, attributes: ['id', 'categoryName'], required: false },
          includeLatestPicture
        ],
        order: [['createdAt', 'DESC']]
      });
      formatted = resetItems.map(formatItem);
      filtered = await BaseFilter(formatted, req.user);

      // Sort reset items too
      const sortedResetItems = filtered.sort((a, b) => {
        const aCategoryMatch = a.ItemCategories?.some(cat => interestedCategories.includes(cat)) ? 1 : 0;
        const bCategoryMatch = b.ItemCategories?.some(cat => interestedCategories.includes(cat)) ? 1 : 0;

        const aLocationMatch = a.ownerLocation === userLocation ? 1 : 0;
        const bLocationMatch = b.ownerLocation === userLocation ? 1 : 0;

        if (aCategoryMatch !== bCategoryMatch) return bCategoryMatch - aCategoryMatch;
        if (aLocationMatch !== bLocationMatch) return bLocationMatch - aLocationMatch;
        return 0;
      });

      return res.status(200).json({ items: sortedResetItems.slice(0, 10) });
    }

    return res.status(200).json({ items: sortedItems.slice(0, 10) });
  } catch (error) {
    console.error('Error in getAvailableUnwatchedItems:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
