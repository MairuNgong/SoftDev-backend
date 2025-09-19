const { Op } = require('sequelize');

const sequelize = require('../config/db');
const { User, Item, ItemCatagory, ItemPicture } = require('../models');

/**
 * @desc Get all unwatched items for a specific user (fallback: random items)
 * @route GET /items/un_watched_item
 * @access Public (tryAuth)
 */

async function filterItemsForSearch(items, user) {
  if (!items || !Array.isArray(items)) return [];

  // Get the IDs of the items passed in
  const itemIds = items.map(item => item.id);

  if (itemIds.length === 0) return [];

  // Query DB: find items that are in active trades
  const activeItems = await sequelize.query(
    `
    SELECT DISTINCT ti."itemId"
    FROM "TradeItems" ti
    JOIN "TradeTransactions" tt ON ti."transactionId" = tt.id
    WHERE tt.status IN ('Matching', 'Complete')
      AND ti."itemId" IN (:itemIds)
    `,
    {
      replacements: { itemIds },
      type: sequelize.QueryTypes.SELECT
    }
  );

  const activeIds = activeItems.map(i => i.itemId);

  // Filter items
  return items
    .filter(item => {
      // Exclude items in active trades
      if (activeIds.includes(item.id)) return false;

      // Exclude items owned by the current user
      if (user && user.email && item.ownerEmail === user.email) return false;

      return true;
    });
}


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

    // map result
    items = items.map(item => {
      const plain = item.get({ plain: true });
      const cats = plain.ItemCatagories || plain.ItemCategories || [];
      const pics = plain.ItemPictures || [];
      return {
        id: plain.id,
        name: plain.name,
        priceRange: plain.priceRange,
        ownerEmail: plain.ownerEmail,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        ItemCategories: Array.isArray(cats) ? cats.map(c => c.categoryName) : [],
        ItemPictures: Array.isArray(pics) ? pics.map(p => p.imageLink) : []
      };
    });

    const filteredItems = await filterItemsForSearch(items, req.user);

    // Step 4: Return filtered items
    return res.status(200).json({ items: filteredItems });
    
  } catch (err) {
    console.error('searchByCategoryAndKeyword error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAvailableUnwatchedItems = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
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
  const user = await User.findOne({ where: { email: req.user.email } });
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
          
          { ownerEmail: { [Op.ne]: req.user.email } }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: 10 // Added limit to return only 10 items
    });

    let items = availableUnwatchedItems;
    items = items.map(item => {
      const plain = item.get({ plain: true });
      const cats = plain.ItemCatagories || plain.ItemCategories || [];
      const pics = plain.ItemPictures || [];
      return {
        id: plain.id,
        name: plain.name,
        priceRange: plain.priceRange,
        ownerEmail: plain.ownerEmail,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        ItemCategories: Array.isArray(cats) ? cats.map(c => c.categoryName) : [],
        ItemPictures: Array.isArray(pics) ? pics.map(p => p.imageLink) : []
      };
    });

    return res.status(200).json(items);
  } catch (error) {
    console.error('Error in getAvailableUnwatchedItems:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

