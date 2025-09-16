const User = require('../models/User');
const Item = require('../models/Item');
const ItemPicture = require('../models/ItemPicture');
const ItemCatagory = require('../models/ItemCatagory'); // project spelling
const InterestedCatagory = require('../models/InterestedCatagory');



exports.profile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.email,{
      include: { model: InterestedCatagory, attributes: ['categoryName'] }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const owner = !!(req.user && req.user.email === user.email);

    const items = await Item.findAll({
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

    res.json({ user, items, owner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
