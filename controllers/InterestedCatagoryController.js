// src/controllers/InterestedCatagoryController.js
// NOTE: Keeps the project's "Catagory" spelling for compatibility.

const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const { User, InterestedCatagory } = require('../models');

/**
 * GET /interested-categories
 * Returns all interested categories for the authenticated user.
 */
exports.list = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const rows = await InterestedCatagory.findAll({
            where: { userEmail: email },
            order: [['categoryName', 'ASC']]
        });

        return res.status(200).json({
            items: rows.map(r => ({ id: r.id, categoryName: r.categoryName }))
        });
    } catch (err) {
        console.error('InterestedCatagory.list error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /interested-categories
 * Body: { categoryName: string }
 * Adds a single interested category if not already present.
 */
exports.add = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const raw = String(req.body?.categoryName || '').trim();
        if (!raw) return res.status(400).json({ error: 'categoryName is required' });

        // Optional normalization (trim only; keep original case to match your UI)
        const categoryName = raw;

        // Try findOrCreate first (atomic-ish). The unique index guarantees no duplicates.
        const [row, created] = await InterestedCatagory.findOrCreate({
            where: { userEmail: email, categoryName },
            defaults: { userEmail: email, categoryName }
        });

        if (!created) {
            return res.status(409).json({
                error: 'Category already added for this user',
                item: { id: row.id, categoryName: row.categoryName }
            });
        }

        return res.status(201).json({
            id: row.id,
            categoryName: row.categoryName
        });
    } catch (err) {
        // Handle DB unique violation gracefully
        if (err instanceof Sequelize.UniqueConstraintError) {
            return res.status(409).json({ error: 'Category already added for this user' });
        }
        console.error('InterestedCatagory.add error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /interested-categories/bulk
 * Body: { categories: string[] }
 * Adds multiple interested categories, skipping duplicates.
 */
exports.bulkAdd = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const categories = Array.isArray(req.body?.categories) ? req.body.categories : [];
        const cleaned = Array.from(
            new Set(
                categories
                    .map(c => String(c || '').trim())
                    .filter(Boolean)
            )
        );

        if (cleaned.length === 0) {
            return res.status(400).json({ error: 'categories must be a non-empty array of strings' });
        }

        // Fetch existing for this user
        const existing = await InterestedCatagory.findAll({
            where: { userEmail: email }
        });
        const existingSet = new Set(existing.map(r => r.categoryName));

        const toInsert = cleaned.filter(c => !existingSet.has(c));

        // Insert only new ones
        if (toInsert.length > 0) {
            await InterestedCatagory.bulkCreate(
                toInsert.map(categoryName => ({ userEmail: email, categoryName })),
                { ignoreDuplicates: true } // works on MySQL & Postgres for unique indexes
            );
        }

        const result = await InterestedCatagory.findAll({
            where: { userEmail: email },
            order: [['categoryName', 'ASC']]
        });

        return res.status(200).json({
            added: toInsert,
            skipped: cleaned.filter(c => existingSet.has(c)),
            items: result.map(r => ({ id: r.id, categoryName: r.categoryName }))
        });
    } catch (err) {
        if (err instanceof Sequelize.UniqueConstraintError) {
            // Even with ignoreDuplicates, some dialects might still throw for races
            return res.status(200).json({ info: 'Some categories were already present and were skipped' });
        }
        console.error('InterestedCatagory.bulkAdd error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * DELETE /interested-categories/:id
 * Removes one interested category row by ID (only for current user).
 */
exports.remove = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const id = Number(req.params?.id);
        if (!id) return res.status(400).json({ error: 'Valid id param is required' });

        const row = await InterestedCatagory.findOne({
            where: { id, userEmail: email }
        });
        if (!row) return res.status(404).json({ error: 'Not found' });

        await row.destroy();
        return res.status(204).send();
    } catch (err) {
        console.error('InterestedCatagory.remove error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
