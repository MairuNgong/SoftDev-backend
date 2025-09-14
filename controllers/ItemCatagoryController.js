const ItemCatagory = require('../models/ItemCatagory');
const Item = require('../models/Item');

// GET /item-catagory  (?itemId=123)
exports.list = async (req, res) => {
    try {
        const { itemId } = req.query;
        const where = {};
        if (itemId) where.itemId = itemId;
        const rows = await ItemCatagory.findAll({ where, order: [['createdAt', 'DESC']] });
        return res.json({ data: rows });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// GET /item-catagory/:id
exports.getOne = async (req, res) => {
    try {
        const row = await ItemCatagory.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: 'Not found' });
        return res.json({ data: row });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// POST /item-catagory
// body: { itemId, categoryName }
exports.create = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const { itemId, categoryName } = req.body;
        if (!itemId || !categoryName) {
            return res.status(400).json({ error: 'itemId and categoryName are required' });
        }

        // ensure current user owns the item (optional but safer)
        const item = await Item.findByPk(itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.ownerEmail !== email) return res.status(403).json({ error: 'Not item owner' });

        const created = await ItemCatagory.create({ itemId, categoryName });
        return res.status(201).json({ data: created });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// PUT /item-catagory/:id
// body: { categoryName }
exports.update = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const row = await ItemCatagory.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: 'Not found' });

        // ownership check via the linked item
        const item = await Item.findByPk(row.itemId);
        if (!item) return res.status(404).json({ error: 'Linked item not found' });
        if (item.ownerEmail !== email) return res.status(403).json({ error: 'Not item owner' });

        const { categoryName } = req.body;
        if (categoryName !== undefined) row.categoryName = categoryName;

        await row.save();
        return res.json({ data: row });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// DELETE /item-catagory/:id
exports.remove = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const row = await ItemCatagory.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: 'Not found' });

        const item = await Item.findByPk(row.itemId);
        if (!item) return res.status(404).json({ error: 'Linked item not found' });
        if (item.ownerEmail !== email) return res.status(403).json({ error: 'Not item owner' });

        await row.destroy();
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
