const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/InterestedCatagoryController');
const { requireAuth, tryAuth } = require('../middleware/auth');

// List (optionally filter by ?email=)
router.get('/', tryAuth, ctrl.list);

// Get one
router.get('/:id', tryAuth, ctrl.getOne);

// Create (uses email from JWT)
router.post('/', requireAuth, ctrl.create);

// Update (owner only)
router.put('/:id', requireAuth, ctrl.update);

// Delete (owner only)
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
