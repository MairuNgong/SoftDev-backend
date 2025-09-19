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

    const whereItem = {};
    if (keyword && String(keyword).trim()) {
      const k = String(keyword).trim();
      whereItem[Op.or] = [{ name: { [Op.iLike]: `%${k}%` } }];
    }

    const include = [];
    if (Array.isArray(categories) && categories.length > 0) {
      const list = categories.map(s => String(s).trim()).filter(Boolean);
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
    include.push({
      model: ItemPicture,
      attributes: ['imageLink', 'createdAt'],
      limit: 1,
      order: [['createdAt', 'DESC']],
      separate: true
    });

    let items = await Item.findAll({
      where: whereItem,
      include,
      distinct: true,
      order: [['createdAt', 'DESC']]
    });

    items = items.map(item => {
      const plain = item.get({ plain: true });
      const cats = plain.ItemCategories || plain.ItemCatagories || [];
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
          )`)
            }
          },
          { ownerEmail: { [Op.ne]: req.user.email} }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: 10 // Added limit to return only 10 items
    });
    let items = availableUnwatchedItems;
    items = items.map(item => {
      const plain = item.get({ plain: true });
      const cats = plain.ItemCategories || plain.ItemCatagories || [];
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

