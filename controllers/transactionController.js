const { Op } = require('sequelize');
const { TradeTransaction, TradeItem, Item,ItemCatagory,ItemPicture } = require('../models');

exports.getTransactions = async (req, res) => {
  try {
    let transactions = await TradeTransaction.findAll({
      where: {
        [Op.or]: [
          { offerEmail: req.user.email },
          { accepterEmail: req.user.email }
        ]
      },
      include: [
        {
          model: TradeItem,
          include: 
            {
              model: Item,
              include: [
                { model: ItemCatagory, attributes: ['categoryName'] }, 
                {
                  model: ItemPicture,
                  attributes: ['imageLink'],
                  limit: 1,
                  order: [['createdAt', 'DESC']],
                  separate: true,   // Ensures limit works per item
                },
              ]
            }
          
          
        }
      ],
      order: [['status', 'ASC']] 
    });

    
    transactions = transactions.map(t => t.get({ plain: true }));
    transactions.forEach(t => {
      t.TradeItems.forEach(tradeItem => {
        let item = tradeItem.Item;
        if (item && item.ItemCategories) {
          item.ItemCategories = item.ItemCategories.map(c => c.categoryName);
        }
        if (item && item.ItemPictures) {
          item.ItemPictures = item.ItemPictures.map(p => p.imageLink);
        }
      });
    });

    res.json({transactions});
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
    const user = req.user.email;
    const transaction = await TradeTransaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (transaction.accepterEmail !== user) {
      return res.status(403).json({ error: 'You cant accept this transaction' });
    }
    if(transaction.status == 'Offering') transaction.status = 'Matching';
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
    const user = req.user.email;
    const transaction = await TradeTransaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    // Check who is confirming
    if (transaction.offerEmail === user) {
      transaction.isOffererConfirm = true;
    } else if (transaction.accepterEmail === user) {
      transaction.isAccepterConfirm = true;
    } else {
      return res.status(403).json({ error: 'You are not part of this transaction' });
    }
    if (transaction.isOffererConfirm && transaction.isAccepterConfirm) {
      transaction.status = 'Complete';
    }
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
    const user = req.user.email;
    const transaction = await TradeTransaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (transaction.offerEmail !== user && transaction.accepterEmail !== user) {
      return res.status(403).json({ error: 'You are not part of this transaction' });
    }

    if(transaction.status != 'Complete')transaction.status = 'cancelled';
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


