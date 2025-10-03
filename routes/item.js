const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const ViewItemController = require('../controllers/ViewItemController');
const { requireAuth, tryAuth } = require('../middleware/auth');
const { upload, uploadImageToCloudinary } = require('../middleware/cloudinary');

router.get('/', tryAuth, itemController.getItems);





router.get('/available_items', tryAuth, ViewItemController.getAvailableUnwatchedItems);
router.get('/:id', tryAuth, itemController.getItemById);

router.get('/:id', tryAuth, itemController.getItemById);

router.post('/search', tryAuth, ViewItemController.searchByCategoryAndKeyword);

router.post('/', requireAuth, upload.single('ItemPicture'), uploadImageToCloudinary('Softdev/Item'), itemController.createItem);


router.put('/:id', requireAuth, upload.single('ItemPicture'), uploadImageToCloudinary('Softdev/Item'), itemController.updateItem);

router.delete('/:id', requireAuth, itemController.deleteItem);

module.exports = router;
