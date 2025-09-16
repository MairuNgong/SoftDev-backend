const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { requireAuth, tryAuth } = require('../middleware/auth');

// list transactions for the logged-in user
router.get('/', requireAuth, transactionController.getTransactions);

router.post('/offer', requireAuth, transactionController.createOffer);

router.put('/matching', requireAuth, transactionController.matchOffer);

router.put('/confirm', requireAuth, transactionController.confirmMatch);

router.put('/cancel', requireAuth, transactionController.cancelTransaction);

module.exports = router;