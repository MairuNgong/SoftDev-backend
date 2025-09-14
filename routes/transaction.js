const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { requireAuth, tryAuth } = require('../middleware/auth');

// list transactions for the logged-in user
router.get('/', requireAuth, transactionController.getTransactions);

router.post('/offer', requireAuth, transactionController.createOffer);

router.put('/macthing', requireAuth, transactionController.createOffer);

router.put('/confirm', requireAuth, transactionController.confirmMatch);

router.put('/cancel', requireAuth, transactionController.rejectMatch);

router.put('/reject', requireAuth, transactionController.completeTransaction);