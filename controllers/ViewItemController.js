const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { User, Item, ItemCatagory, ItemPicture } = require('../models');

exports.getUnwatchedItems = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      const randomItems = await Item.findAll({
        order: [[sequelize.fn('RANDOM')]],
        limit: 10,
        include: [{ model: ItemCatagory, attributes: ['id', 'categoryName'] }]
      });
      return res.json(randomItems);
    }

    const user = await User.findByPk(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const watchedItems = await user.getWatchedItems({ joinTableAttributes: [] });
    const watchedItemIds = watchedItems.map(i => i.id);

    const unwatchedItems = await Item.findAll({
      where: { id: { [Op.notIn]: watchedItemIds } },
      order: [['createdAt', 'DESC']],
      include: [{ model: ItemCatagory, attributes: ['id', 'categoryName'] }]
    });

    return res.json(unwatchedItems);
  } catch (error) {
    console.error('Error fetching unwatched items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

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

    return res.status(200).json({ items });
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

    const user = await User.findByPk(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const watchedItems = await user.getWatchedItems({ joinTableAttributes: [] });
    const watchedItemIds = watchedItems.map(i => i.id);

    const availableUnwatchedItems = await Item.findAll({
      where: {
        [Op.and]: [
          { id: { [Op.notIn]: watchedItemIds } },
          {
            id: {
              [Op.notIn]: sequelize.literal(`(
                SELECT DISTINCT ti."itemId"
                FROM "TradeItems" ti
                JOIN "TradeTransactions" tt ON ti."transactionId" = tt.id
                WHERE tt.status IN ('Matching', 'Complete')
              )`)
            }
          },
          { ownerEmail: { [Op.ne]: req.user.email } }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: 10
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
