// controllers/transactionController.js
"use strict";

const { Op } = require("sequelize");
const {
  TradeTransaction,
  TradeItem,
  Item,
  ItemCatagory,
  ItemPicture,
} = require("../models");

// If you use this elsewhere, import it; otherwise it's unused.
// const { formatItem } = require("../utils/itemFilter");

/**
 * List transactions for the logged-in user
 */
exports.getTransactions = async (req, res) => {
  try {
    let transactions = await TradeTransaction.findAll({
      where: {
        [Op.or]: [{ offerEmail: req.user.email }, { accepterEmail: req.user.email }],
      },
      include: [
        {
          model: TradeItem,
          include: {
            model: Item,
            include: [
              { model: ItemCatagory, attributes: ["categoryName"] },
              {
                model: ItemPicture,
                attributes: ["imageLink"],
                limit: 1,
                order: [["createdAt", "DESC"]],
                separate: true, // ensure limit applies per item
              },
            ],
          },
        },
      ],
      order: [["status", "ASC"]],
    });

    // Flatten nested arrays for categories/pictures
    transactions = transactions.map((t) => t.get({ plain: true }));
    transactions.forEach((t) => {
      (t.TradeItems || []).forEach((tradeItem) => {
        const item = tradeItem.Item;
        if (!item) return;
        if (item.ItemCategories) {
          item.ItemCategories = item.ItemCategories.map((c) => c.categoryName);
        }
        if (item.ItemPictures) {
          item.ItemPictures = item.ItemPictures.map((p) => p.imageLink);
        }
      });
    });

    res.json({ transactions });
  } catch (err) {
    console.error("getTransactions error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create a new offer
 */
exports.createOffer = async (req, res) => {
  try {
    const { accepterEmail, offerMoney, requestMoney, offerItems = [], requestItems = [] } = req.body;
    const offerEmail = req.user.email;

    // Prevent duplicate offering of the same items to the same accepter while "Offering"
    if (offerItems.length > 0) {
      const existingTransactions = await TradeTransaction.findAll({
        where: { offerEmail, accepterEmail, status: "Offering" },
        include: [{ model: TradeItem, as: "TradeItems" }],
      });

      const existingItemIds = new Set(
        existingTransactions.flatMap((t) => (t.TradeItems || []).map((i) => i.itemId))
      );

      const duplicateItems = offerItems.filter((itemId) => existingItemIds.has(itemId));
      if (duplicateItems.length > 0) {
        return res.status(400).json({
          error: `You have already offered these items to ${accepterEmail}: ${duplicateItems.join(
            ", "
          )}`,
        });
      }
    }

    // Create the transaction
    const transaction = await TradeTransaction.create({
      offerEmail,
      accepterEmail,
      status: "Offering",
      offerMoney: offerMoney ?? null,
      requestMoney: requestMoney ?? null,
    });

    // Attach offer items
    if (offerItems.length > 0) {
      await Promise.all(
        offerItems.map((itemId) =>
          TradeItem.create({
            transactionId: transaction.id,
            itemId,
          })
        )
      );
    }

    // Attach request items
    if (requestItems.length > 0) {
      await Promise.all(
        requestItems.map((itemId) =>
          TradeItem.create({
            transactionId: transaction.id,
            itemId,
          })
        )
      );
    }

    res.status(201).json(transaction);
  } catch (err) {
    console.error("createOffer error:", err);
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

    const transaction = await TradeTransaction.findByPk(transactionId, {
      include: { model: TradeItem, include: [Item] },
    });
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    // Only the intended accepter can match
    if (transaction.accepterEmail !== user) {
      return res.status(403).json({ error: "You cant accept this transaction" });
    }

    // Prevent item conflicts with other "Matching" transactions
    const itemIds = (transaction.TradeItems || []).map((ti) => ti.itemId);

    const conflict = await TradeTransaction.findOne({
      where: { status: "Matching", id: { [Op.ne]: transactionId } },
      include: { model: TradeItem, where: { itemId: { [Op.in]: itemIds } } },
    });
    if (conflict) {
      return res
        .status(400)
        .json({ error: "Some items are already involved in another matching transaction" });
    }

    if (transaction.status === "Offering") {
      transaction.status = "Matching";
      await transaction.save();
    }

    res.json(transaction);
  } catch (err) {
    console.error("matchOffer error:", err);
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
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    if (transaction.status !== "Matching") {
      return res.status(400).json({ error: "Transaction is not in Matching status" });
    }

    if (transaction.offerEmail === user) {
      transaction.isOffererConfirm = true;
    } else if (transaction.accepterEmail === user) {
      transaction.isAccepterConfirm = true;
    } else {
      return res.status(403).json({ error: "You are not part of this transaction" });
    }

    if (transaction.isOffererConfirm && transaction.isAccepterConfirm) {
      transaction.status = "Complete";
    }

    await transaction.save();
    res.json(transaction);
  } catch (err) {
    console.error("confirmMatch error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Cancel a transaction (unless already complete)
 */
exports.cancelTransaction = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const user = req.user.email;

    const transaction = await TradeTransaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    if (transaction.offerEmail !== user && transaction.accepterEmail !== user) {
      return res.status(403).json({ error: "You are not part of this transaction" });
    }

    if (transaction.status !== "Complete") {
      transaction.status = "Cancelled";
      await transaction.save();
    }

    res.json(transaction);
  } catch (err) {
    console.error("cancelTransaction error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rate a transaction (score 1–10)
 * - Rater identity from auth (req.user.email)
 * - Rater must be either offerer or accepter
 * - Rating applies to the OTHER party
 * - Only allowed when status === 'Complete'
 * - Prevents duplicate ratings (adjust as needed)
 */
exports.rateTransaction = async (req, res) => {
  try {
    const { transactionId, score } = req.body;
    const raterEmail = req.user?.email;

    if (!transactionId || Number.isNaN(Number(transactionId))) {
      return res.status(400).json({ error: "transactionId is required and must be a number" });
    }
    const parsedScore = Number(score);
    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 10) {
      return res.status(400).json({ error: "score must be an integer between 1 and 10" });
    }
    if (!raterEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const tx = await TradeTransaction.findByPk(transactionId);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    if (tx.status !== "Complete") {
      return res
        .status(409)
        .json({ error: "You can only rate a transaction when it's Complete" });
    }

    let targetField = null;
    if (tx.offerEmail === raterEmail) {
      targetField = "accepterRating"; // offerer rates the accepter
    } else if (tx.accepterEmail === raterEmail) {
      targetField = "offererRating"; // accepter rates the offerer
    } else {
      return res.status(403).json({ error: "You are not a participant in this transaction" });
    }

    if (tx[targetField] != null) {
      return res.status(409).json({ error: "You have already submitted a rating for this transaction" });
    }

    tx[targetField] = parsedScore;
    await tx.save();

    return res.status(200).json({
      message: "Rating submitted",
      data: {
        id: tx.id,
        status: tx.status,
        offerEmail: tx.offerEmail,
        accepterEmail: tx.accepterEmail,
        offererRating: tx.offererRating,
        accepterRating: tx.accepterRating,
        updatedAt: tx.updatedAt,
      },
    });
  } catch (err) {
    console.error("rateTransaction error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
