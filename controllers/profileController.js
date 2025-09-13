const User = require('../models/User');
const Item = require('../models/Item');

exports.profile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.email);
    if (!user) return res.status(404).json({ error: 'User not found' });


    const owner = req.user && req.user.email === user.email;

    const items = await Item.findAll({ where: { ownerEmail: user.email } });
    res.json({ user, items, owner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

