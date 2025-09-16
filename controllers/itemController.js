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
    const { categoryName, categoryNames } = body || {};
    if (Array.isArray(categoryNames)) {
        return categoryNames.filter(Boolean).map(s => String(s).trim()).filter(Boolean);
    }
    if (typeof categoryName === 'string') {
        const s = categoryName.trim();
        return s ? [s] : [];
    }
    return null; // not provided at all
}

const includeCategories = [
    { model: ItemCatagory, attributes: ['id', 'categoryName', 'createdAt', 'updatedAt'] }
];

/** GET /items  (?ownerEmail=&status=) */
exports.getItems = async (req, res) => {
    try {
        const where = {};
        if (req.query.ownerEmail) where.ownerEmail = req.query.ownerEmail;
        if (req.query.status) where.status = req.query.status;

        const items = await Item.findAll({
            where,
            order: [['createdAt', 'DESC']],
            include: includeCategories
        });

        return res.json({ data: items });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/** GET /items/:id  -> { data, owner } */
exports.getItemById = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id, { include: includeCategories });
        if (!item) return res.status(404).json({ error: 'Item not found' });
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
        const item = await Item.create(payload);

        // 2) Create categories if provided
        const cats = extractCategories(req.body);
        if (Array.isArray(cats) && cats.length > 0) {
            await ItemCatagory.bulkCreate(
                cats.map(name => ({ itemId: item.id, categoryName: name }))
            );
        }

        // 3) IMPORTANT: refetch with include so response shows the just-added categories
        const fresh = await Item.findByPk(item.id, { include: includeCategories });
        return res.status(201).json({ data: fresh });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

/** PUT /items/:id — replaces categories only if categoryName/Names provided */
exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (!req.user || item.ownerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Not the owner' });
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
        const fresh = await Item.findByPk(item.id, { include: includeCategories });
        return res.json({ data: fresh });
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
