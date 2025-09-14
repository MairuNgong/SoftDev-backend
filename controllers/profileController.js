const User = require('../models/User');
const Item = require('../models/Item');
const ItemPicture = require('../models/ItemPicture');

exports.profile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const owner = !!(req.user && req.user.email === user.email);

    const items = await Item.findAll({
      where: { ownerEmail: user.email },
      include: [
        {
          model: ItemPicture,
          attributes: ['imageLink'],
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    // Flatten latest image into each item
    const itemsWithImage = items.map(item => {
      const itemJson = item.toJSON();
      itemJson.ItemPictures = itemJson.ItemPictures?.[0]?.imageLink || null; //choose only the latest image
      return itemJson;
    });

    res.json({ user, items: itemsWithImage, owner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
