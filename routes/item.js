const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController'); // make sure casing matches your file
const ViewItemController = require('../controllers/ViewItemController');
const { requireAuth, tryAuth } = require('../middleware/auth');
const { upload, uploadImageToCloudinary } = require('../middleware/cloudinary');

// Public: list items (optionally filter ?ownerEmail=&status=)
router.get('/', tryAuth, itemController.getItems);

router.get('/un_watched_item', tryAuth, ViewItemController.getUnwatchedItems);

// Public: search items by categories + keyword (body JSON)
router.post('/search', tryAuth, ViewItemController.searchByCategoryAndKeyword);

// Public: get one item; responds with { item, owner: boolean }
router.get('/:id', tryAuth, itemController.getItemById);

// Auth required: create
router.post('/', requireAuth, upload.single('ItemPicture'), uploadImageToCloudinary('Softdev/Item'), itemController.createItem);

// Auth required + owner check: update
router.put('/:id', requireAuth, upload.single('ItemPicture'), uploadImageToCloudinary('Softdev/Item'), itemController.updateItem);

// Auth required + owner check: delete
router.delete('/:id', requireAuth, itemController.deleteItem);

module.exports = router;
