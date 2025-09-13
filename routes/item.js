const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { requireAuth, tryAuth } = require('../middleware/auth');

// Public: list items (optionally filter ?ownerEmail=&status=)
// router.get('/', tryAuth, itemController.getItems);

// Public: get one item; responds with { item, owner: boolean }
router.get('/:id', tryAuth, itemController.getItemById);

// Auth required: create
router.post('/', requireAuth, itemController.createItem);

// Auth required + owner check: update
router.put('/:id', requireAuth, itemController.updateItem);

// Auth required + owner check: delete
router.delete('/:id', requireAuth, itemController.deleteItem);

module.exports = router;
