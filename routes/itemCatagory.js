const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ItemCatagoryController');
const { requireAuth, tryAuth } = require('../middleware/auth');

// List (optionally filter by ?itemId=)
router.get('/', tryAuth, ctrl.list);

// Get one
router.get('/:id', tryAuth, ctrl.getOne);

// Create (owner of item only)
router.post('/', requireAuth, ctrl.create);

// Update (owner of item only)
router.put('/:id', requireAuth, ctrl.update);

// Delete (owner of item only)
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
