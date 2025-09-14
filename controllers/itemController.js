// controllers/ItemController.js
const { Item } = require('../models');

/**
 * GET /items
 * Optional query: ?ownerEmail=&status=
 */
exports.getItems = async (req, res) => {
    try {
        const { ownerEmail, status } = req.query;
        const where = {};
        if (ownerEmail) where.ownerEmail = ownerEmail;
        if (status) where.status = status;

        const items = await Item.findAll({ where, order: [['createdAt', 'DESC']] });
        return res.json(items);
    } catch (err) {
        console.error('getItems error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /items/:id
 */
exports.getItemById = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        const owner = req.user && req.user.email === item.ownerEmail;
        return res.json({ item, owner });
    } catch (err) {
        console.error('getItemById error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /items
 * Requires requireAuth. Accepts body fields and optional req.body.imageUrl from cloudinary middleware.
 */
exports.createItem = async (req, res) => {
    try {
        const { name, description, priceRange, status } = req.body;
        if (!name || !description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }

        const newItem = await Item.create({
            name,
            description,
            priceRange,
            status: status || 'available',
            ownerEmail: req.user.email,
            imageUrl: req.body.imageUrl || null,
            imagePublicId: req.body.imagePublicId || null
        });

        return res.status(201).json(newItem);
    } catch (err) {
        console.error('createItem error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * PUT /items/:id
 * Requires requireAuth + ownership.
 */
exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.ownerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Not authorized to update this item' });
        }

        const { name, description, priceRange, status } = req.body;
        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (priceRange !== undefined) item.priceRange = priceRange;
        if (status !== undefined) item.status = status;
        if (req.body.imageUrl) item.imageUrl = req.body.imageUrl;
        if (req.body.imagePublicId) item.imagePublicId = req.body.imagePublicId;

        await item.save();
        return res.json(item);
    } catch (err) {
        console.error('updateItem error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * DELETE /items/:id
 * Requires requireAuth + ownership.
 */
exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.ownerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Not authorized to delete this item' });
        }

        await item.destroy();
        return res.json({ success: true });
    } catch (err) {
        console.error('deleteItem error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
