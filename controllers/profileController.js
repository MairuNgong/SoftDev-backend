const User = require('../models/User');
const Item = require('../models/Item');
const jwt = require('jsonwebtoken');

exports.profile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let owner = false;

    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.email === user.email) {
          owner = true;
        }
      } catch (err) {
        // Invalid token, ignore
      }
    }

    const items = await Item.findAll({ where: { ownerEmail: user.email } });
    res.json({ user, items, owner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};

