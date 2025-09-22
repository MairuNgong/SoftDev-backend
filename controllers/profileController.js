const {User,Item,ItemPicture,ItemCatagory,InterestedCatagory,TradeTransaction,TradeItem} = require('../models');
const formatItem = require('../utils/itemFilter').formatItem;



exports.profile = async (req, res) => {
  try {
    let user = await User.findByPk(req.params.email,{
      include: { model: InterestedCatagory, attributes: ['categoryName'] }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    user = user.get({ plain: true });
    user.InterestedCategories = user.InterestedCategories.map(c => c.categoryName);

    // is the requester the owner of this profile?
    const owner = !!(req.user && req.user.email === user.email);

    let items = await Item.findAll({
      where: { ownerEmail: user.email },
      order: [['createdAt', 'DESC']],
      include: [
        { model: ItemCatagory, attributes: ['categoryName'] }, 
        {
          model: ItemPicture,
          attributes: ['imageLink'],
          limit: 1,
          order: [['createdAt', 'DESC']],
          separate: true,   // Ensures limit works per item
        },
      ],
    });
    items = items.map(item => formatItem(item));

    const itemIds = items.map(i => i.id);
    const tradeItems = await TradeItem.findAll({
      where: { itemId: itemIds },
      include: { model: TradeTransaction, attributes: ['status'] }
    });

    // Make a lookup: itemId => status (take highest priority if multiple transactions)
    const statusMap = {}; // itemId => status
    tradeItems.forEach(ti => {
      const status = ti.TradeTransaction?.status;
      if (!status) return;

      // Priority: Complete > Matching > Available (Offering/Cancelled)
      if (status === 'Complete') statusMap[ti.itemId] = 'Complete';
      else if (status === 'Matching' && statusMap[ti.itemId] !== 'Complete') statusMap[ti.itemId] = 'Matching';
      else if ((status === 'Offering' || status === 'Cancelled') && !statusMap[ti.itemId]) statusMap[ti.itemId] = 'Available';
    });

    // Separate items into three groups
    const Available = items.filter(i => !statusMap[i.id] || statusMap[i.id] === 'Available');
    const Matching = items.filter(i => statusMap[i.id] === 'Matching');
    const Complete = items.filter(i => statusMap[i.id] === 'Complete');


    res.json({ user, Available, Matching, Complete, owner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
