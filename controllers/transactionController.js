const { Op } = require('sequelize');
const { User,TradeTransaction, TradeItem, Item,ItemCatagory,ItemPicture } = require('../models');
const sequelize = require('../config/db');
const {formatItem} = require("../utils/itemFilter")

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

    // Find transaction
    const transaction = await TradeTransaction.findByPk(transactionId, {
      include: {
        model: TradeItem,
        include: [Item]
      }
    });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    // Check permission
    if (transaction.accepterEmail !== user) {
      return res.status(403).json({ error: 'You cant accept this transaction' });
    }

    // Get all itemIds in this transaction
    const itemIds = transaction.TradeItems.map(ti => ti.itemId);

    // Check if any of these items are already in another Matching transaction
    const conflict = await TradeTransaction.findOne({
      where: {
        status: 'Matching',
        id: { [Op.ne]: transactionId }
      },
      include: {
        model: TradeItem,
        where: {
          itemId: { [Op.in]: itemIds }
        }
      }
    });

    if (conflict) {
      return res.status(400).json({
        error: 'Some items are already involved in another matching transaction'
      });
    }

    // Update status
    if (transaction.status === 'Offering') {
      transaction.status = 'Matching';
      await transaction.save();
    }

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

    if (transaction.status !== 'Matching') {
      return res.status(400).json({ error: 'Transaction is not in Matching status' });
    }
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

    if(transaction.status != 'Complete')transaction.status = 'Cancelled';
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// adjust path as needed

exports.getOffer = async (req, res) => {
  try {
    // Guest (no login) → return empty
    if (!req.user || !req.user.email) {
      return res.status(200).json({ items: [] });
    }

    const user = await User.findByPk(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // ✅ Fixed SQL query - use single quotes for string comparison
    const receivedItems = await sequelize.query(
      `
      SELECT ti."itemId"
      FROM "TradeItems" ti
      JOIN "TradeTransactions" tt ON ti."transactionId" = tt.id
      WHERE tt."accepterEmail" = :email AND tt.status = 'Offering'
      `,
      {
        replacements: { email: req.user.email },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const itemIds = receivedItems.map(i => i.itemId);
    
    // If no items found, return empty array
    if (itemIds.length === 0) {
      return res.status(200).json({ items: [] });
    }

    // ✅ Fetch items with proper includes
    const items = await Item.findAll({
      where: { id: itemIds },
      include: [
        { 
          model: ItemCatagory, 
          attributes: ['categoryName'] 
        },
        { 
          model: ItemPicture, 
          attributes: ['imageLink'] 
        }
      ]
    });

    // ✅ Check if formatItem function exists
    if (typeof formatItem !== 'function') {
      // Fallback formatting if formatItem is missing
      const formatted = items.map(item => {
        const plain = item.get({ plain: true });
        return {
          id: plain.id,
          name: plain.name,
          priceRange: plain.priceRange,
          description: plain.description,
          ownerEmail: plain.ownerEmail,
          createdAt: plain.createdAt,
          updatedAt: plain.updatedAt,
          ItemCategories: plain.ItemCatagories ? plain.ItemCatagories.map(c => c.categoryName) : [],
          ItemPictures: plain.ItemPictures ? plain.ItemPictures.map(p => p.imageLink) : []
        };
      });
      return res.status(200).json({ items: formatted });
    }

    const formatted = items.map(formatItem);
    return res.status(200).json({ items: formatted });

  } catch (error) {
    console.error('Error in getOffer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};