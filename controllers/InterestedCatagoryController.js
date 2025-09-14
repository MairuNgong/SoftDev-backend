const InterestedCatagory = require('../models/InterestedCatagory');
const User = require('../models/User');

// GET /interested-catagory  (?email=you@ex.com)
exports.list = async (req, res) => {
    try {
        const { email } = req.query;
        const where = {};
        if (email) where.email = email;
        const rows = await InterestedCatagory.findAll({ where, order: [['createdAt', 'DESC']] });
        return res.json({ data: rows });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// GET /interested-catagory/:id
exports.getOne = async (req, res) => {
    try {
        const row = await InterestedCatagory.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: 'Not found' });
        return res.json({ data: row });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// POST /interested-catagory
// body: { categoryName }
exports.create = async (req, res) => {
    try {
        // email comes from JWT
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const { categoryName } = req.body;
        if (!categoryName) return res.status(400).json({ error: 'categoryName is required' });

        // optional: ensure user exists
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ error: 'User not found for token email' });

        const created = await InterestedCatagory.create({ email, categoryName });
        return res.status(201).json({ data: created });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// PUT /interested-catagory/:id
// body: { categoryName }
exports.update = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const row = await InterestedCatagory.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: 'Not found' });
        if (row.email !== email) return res.status(403).json({ error: 'Not owner' });

        const { categoryName } = req.body;
        if (categoryName !== undefined) row.categoryName = categoryName;

        await row.save();
        return res.json({ data: row });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// DELETE /interested-catagory/:id
exports.remove = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const row = await InterestedCatagory.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: 'Not found' });
        if (row.email !== email) return res.status(403).json({ error: 'Not owner' });

        await row.destroy();
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
