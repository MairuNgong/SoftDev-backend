const Item = require('../models/Item');

/**
 * Helper to only allow safe fields. Adjust this whitelist to match your Item model.
 * If your Item fields change, update this list accordingly.
 */
const ALLOWED_FIELDS = [
    'name',
    'priceRange',
    'description',
    'condition',
    'location',
    'category',
    'images',        // if you store JSON/array
    'status',        // e.g., 'available', 'traded'
];

function pickAllowed(body) {
    const out = {};
    for (const k of ALLOWED_FIELDS) if (body[k] !== undefined) out[k] = body[k];
    return out;
}

exports.createItem = async (req, res) => {
    try {
        const data = pickAllowed(req.body);
        if (!data.name) {
            return res.status(400).json({ error: 'name is required' });
        }
        // Owner is always the token user
        data.ownerEmail = req.user.email;

        const item = await Item.create(data);
        return res.status(201).json(item);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.getItems = async (req, res) => {
    try {
        const where = {};
        if (req.query.ownerEmail) where.ownerEmail = req.query.ownerEmail;
        if (req.query.status) where.status = req.query.status;

        const items = await Item.findAll({ where, order: [['createdAt', 'DESC']] });
        return res.json({
            items,
            // Optional: reveal if the caller owns the ownerEmail filter
            owner:
                !!req.user &&
                !!req.query.ownerEmail &&
                req.user.email === req.query.ownerEmail,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.getItemById = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const owner = !!req.user && req.user.email === item.ownerEmail;
        return res.json({ item, owner });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        if (item.ownerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Not the owner' });
        }

        const data = pickAllowed(req.body);
        await item.update(data);
        return res.json(item);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        if (item.ownerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Not the owner' });
        }

        await item.destroy();
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
