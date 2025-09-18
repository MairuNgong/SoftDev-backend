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

    return res.status(200).json({ items });
  } catch (err) {
    console.error('searchByCategoryAndKeyword error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAvailableUnwatchedItems = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
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

    const user = await User.findByPk(email);
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
          { ownerEmail: { [Op.ne]: email } }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return res.status(200).json(availableUnwatchedItems);
  } catch (error) {
    console.error('Error in getAvailableUnwatchedItems:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
