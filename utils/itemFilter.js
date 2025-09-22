const sequelize = require('../config/db');

function formatItem(item) {
  const plain = item.get({ plain: true });
  const cats = plain.ItemCatagories || plain.ItemCategories || [];
  const pics = plain.ItemPictures || [];

  return {
    id: plain.id,
    name: plain.name,
    priceRange: plain.priceRange,
    description: plain.description,
    ownerEmail: plain.ownerEmail,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    ItemCategories: Array.isArray(cats) ? cats.map(c => c.categoryName) : [],
    ItemPictures: Array.isArray(pics) ? pics.map(p => p.imageLink) : []
  };
}

async function BaseFilter(items, user) {
  if (!items || !Array.isArray(items)) return [];

  const itemIds = items.map(item => item.id);
  if (itemIds.length === 0) return [];

  // Find which of these items are in active trades
  const activeItems = await sequelize.query(
    `
    SELECT DISTINCT ti."itemId"
    FROM "TradeItems" ti
    JOIN "TradeTransactions" tt ON ti."transactionId" = tt.id
    WHERE tt.status IN ('Matching', 'Complete')
      AND ti."itemId" IN (:itemIds)
    `,
    {
      replacements: { itemIds },
      type: sequelize.QueryTypes.SELECT
    }
  );

  const activeIds = activeItems.map(i => i.itemId);

  // Filter down items
  return items.filter(item => {
    // Exclude items in active trades
    if (activeIds.includes(item.id)) return false;

    // Exclude items owned by the current user
    if (user && user.email && item.ownerEmail === user.email) return false;

    return true;
  });
}

module.exports = { formatItem, BaseFilter };
