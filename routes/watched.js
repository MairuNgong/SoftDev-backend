const express = require('express');
const router = express.Router();
const { requireAuth, tryAuth } = require('../middleware/auth');
const watchedItemController = require('../controllers/watchedItemController');

router.get('/', requireAuth, watchedItemController.GetWatchedItems);
router.post('/', requireAuth, watchedItemController.addWatchedItem);


module.exports = router;