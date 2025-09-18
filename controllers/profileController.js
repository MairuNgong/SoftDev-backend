const User = require('../models/User');
const Item = require('../models/Item');
const ItemPicture = require('../models/ItemPicture');
const ItemCatagory = require('../models/ItemCatagory'); // project spelling
const InterestedCatagory = require('../models/InterestedCatagory');



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
    items = items.map(item => {
      const plainItems = item.get({ plain: true });
      plainItems.ItemCategories = plainItems.ItemCategories.map(c => c.categoryName);
      plainItems.ItemPictures = plainItems.ItemPictures.map(p => p.imageLink);
      return plainItems;
    });
    res.json({ user, items, owner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
