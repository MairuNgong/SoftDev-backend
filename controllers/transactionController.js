const TradeTransaction = require('../models/TradeTransaction');
const User = require('../models/User');
const Item = require('../models/Item');
const TradeItem = require('../models/TradeItem');

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await TradeTransaction.findAll({
      where: { userEmail: req.user.email },
      include: [TradeItem, Item]
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create a new offer
 */
exports.createOffer = async (req, res) => {
  try {
    const { itemId, offerItemId } = req.body;
    // Create a new trade transaction
    const transaction = await TradeTransaction.create({
      userEmail: req.user.email,
      itemId,
      offerItemId,
      status: 'offered'
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Match an offer (accept offer)
 */
exports.matchOffer = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await TradeTransaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    transaction.status = 'matched';
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Confirm a match (finalize transaction)
 */
exports.confirmMatch = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await TradeTransaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    transaction.status = 'confirmed';
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Cancel a match
 */
exports.cancelMatch = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await TradeTransaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    transaction.status = 'cancelled';
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Reject a match
 */
exports.rejectMatch = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await TradeTransaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    transaction.status = 'rejected';
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Complete a transaction
 */
exports.completeTransaction = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await TradeTransaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    transaction.status = 'completed';
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};