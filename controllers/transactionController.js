const TradeTransaction = require('../models/TradeTransaction');
const User = require('../models/User');
const Item = require('../models/Item');
const TradeItem = require('../models/TradeItem');

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await TradeTransaction.findAll({
      where: { userEmail: req.user.email },
      include: TradeItem
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
    // Extract offer/request data
    const { accepterEmail, offerMoney, requestMoney, offerItems = [], requestItems = [] } = req.body;
    const offerEmail = req.user.email;

    // 🔍 Check for conflict: item already offered to same accepter in active transaction
    if (offerItems.length > 0) {
      // Find all active transactions between these two users
      const existingTransactions = await TradeTransaction.findAll({
        where: {
          offerEmail,
          accepterEmail,
          status: 'Offering'
        },
        include: [{ model: TradeItem, as: 'TradeItems' }]
      });

      // Gather all items from existing "Offering" transactions
      const existingItemIds = new Set(
        existingTransactions.flatMap(t => t.TradeItems.map(i => i.itemId))
      );

      // Check overlap
      const duplicateItems = offerItems.filter(itemId => existingItemIds.has(itemId));
      if (duplicateItems.length > 0) {
        return res.status(400).json({
          error: `You have already offered these items to ${accepterEmail}: ${duplicateItems.join(', ')}`
        });
      }
    }

    // ✅ Create a new trade transaction
    const transaction = await TradeTransaction.create({
      offerEmail,
      accepterEmail,
      status: 'Offering',
      offerMoney: offerMoney ?? null,
      requestMoney: requestMoney ?? null,
    });

    // Offer items
    if (offerItems.length > 0) {
      await Promise.all(
        offerItems.map(itemId =>
          TradeItem.create({
            transactionId: transaction.id,
            itemId
          })
        )
      );
    }

    // Request items
    if (requestItems.length > 0) {
      await Promise.all(
        requestItems.map(itemId =>
          TradeItem.create({
            transactionId: transaction.id,
            itemId
          })
        )
      );
    }

    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
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
exports.cancelTransaction = async (req, res) => {
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


