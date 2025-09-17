// controllers/itemController.js
const { Op } = require('sequelize');
const Item = require('../models/Item');
const ItemCatagory = require('../models/ItemCatagory'); // project spelling
const ItemPicture = require('../models/ItemPicture');

/** Safe field whitelist — adjust to your Item model */
const ALLOWED_FIELDS = [
    'name',
    'priceRange',
    'description',
    'condition',
    'location',
    'status',
    'category',
    'images'
];

function pickPayload(body) {
    const out = {};
    for (const k of ALLOWED_FIELDS) {
        if (body[k] !== undefined) out[k] = body[k];
    }
    return out;
}


/** Normalize categoryName/categoryNames into an array, or null if not provided */
function extractCategories(body) {
    const { categoryNames } = body || {};
    if (Array.isArray(categoryNames)) {
        return categoryNames.filter(Boolean).map(s => String(s).trim()).filter(Boolean);
    }
    return null; // not provided at all
}


/** GET /items  (?ownerEmail=&status=) */
exports.getItems = async (req, res) => {
  try {
    const where = {};
    if (req.query.ownerEmail) {
      where.ownerEmail = req.query.ownerEmail;
    }

    let items = await Item.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: ItemCatagory, attributes: ['categoryName'] }, 
        {
          model: ItemPicture,
          attributes: ['imageLink'],
          limit: 1,
          order: [['createdAt', 'DESC']],
          separate: true,   // Ensures limit works per item
        },
      ],
    });

    items = items.map(item => {
      const plain = item.get({ plain: true });
      plain.ItemCategories = plain.ItemCategories.map(c => c.categoryName);
      plain.ItemPictures = plain.ItemPictures.map(p => p.imageLink);
      return plain;
    });
    return res.json({ data: items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/** GET /items/:id  -> { data, owner } */
exports.getItemById = async (req, res) => {
    try {
        let item = await Item.findByPk(req.params.id, { include: [
          { model: ItemCatagory, attributes: ['categoryName'] }, 
          {
            model: ItemPicture,
            attributes: ['imageLink'],
            limit: 1,
            order: [['createdAt', 'DESC']],
            separate: true,   // Ensures limit works per item
          },
        ] });
        
        if (!item) return res.status(404).json({ error: 'Item not found' });
        item = item.get({ plain: true });
        item.ItemCategories = item.ItemCategories.map(c => c.categoryName);
        item.ItemPictures = item.ItemPictures.map(p => p.imageLink);
        const owner = !!(req.user && req.user.email === item.ownerEmail);
        return res.json({ data: item, owner });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/** POST /items  (Auth) — supports categoryName or categoryNames */
exports.createItem = async (req, res) => {
    try {
        const ownerEmail = req.user.email;
        const payload = { ...pickPayload(req.body), ownerEmail };

        if (req.body.imageUrl) {
            await ItemPicture.create({
                itemId: item.id,
                imageLink: req.body.imageUrl
            });
            delete req.body.imageUrl;
        }

        // 1) Create item
        let item = await Item.create(payload);

        // 2) Create categories if provided
        const cats = extractCategories(req.body);
        if (Array.isArray(cats) && cats.length > 0) {
            await ItemCatagory.bulkCreate(
                cats.map(name => ({ itemId: item.id, categoryName: name }))
            );
        }

        const fresh = await Item.findByPk(item.id, { 
          include: [
            { model: ItemCatagory, attributes: ['categoryName'] }, 
            {
              model: ItemPicture,
              attributes: ['imageLink'],
              limit: 1,
              order: [['createdAt', 'DESC']],
              separate: true,
            },
          ] 
        });

        item = fresh.get({ plain: true });

        // map categories to just strings
        item.ItemCategories = item.ItemCategories.map(c => c.categoryName);
        item.ItemPictures = item.ItemPictures.map(c => c.imageLink);
        return res.status(201).json({ data: item });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/** PUT /items/:id — replaces categories only if categoryName/Names provided */
exports.updateItem = async (req, res) => {
    try {
        let item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (!req.user || item.ownerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Not the owner' });
        }

        if (req.body.imageUrl) {
            await ItemPicture.create({
                itemId: item.id,
                imageLink: req.body.imageUrl
            });
            delete req.body.imageUrl;
        }
        // Update item fields
        const updates = pickPayload(req.body);
        await item.update(updates);

        // Replace categories if client provided categoryName/Names
        const cats = extractCategories(req.body);
        if (cats !== null) {
            await ItemCatagory.destroy({ where: { itemId: item.id } });
            if (cats.length > 0) {
                await ItemCatagory.bulkCreate(
                    cats.map(name => ({ itemId: item.id, categoryName: name }))
                );
            }
        }

        // IMPORTANT: refetch with include so you immediately see the new categories
        const fresh = await Item.findByPk(item.id, { include: [
            { model: ItemCatagory, attributes: ['categoryName'] }, 
            {
              model: ItemPicture,
              attributes: ['imageLink'],
              limit: 1,
              order: [['createdAt', 'DESC']],
              separate: true,   // Ensures limit works per item
            },
          ]});
        item = fresh.get({ plain: true });
        item.ItemCategories = item.ItemCategories.map(c => c.categoryName);
        item.ItemPictures = item.ItemPictures.map(p => p.imageLink);
        return res.json({ data: item });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/** DELETE /items/:id */
exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (!req.user || item.ownerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Not the owner' });
        }
        await item.destroy();
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
