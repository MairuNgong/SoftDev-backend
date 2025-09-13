const User = require('../models/User');

// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.findAll();
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    //req.body.imageUrl is set by cloudinary middleware
    if (req.body.imageUrl) {
      req.body.ProfilePicture = req.body.imageUrl;
      delete req.body.imageUrl;
    }

    await user.update(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// exports.deleteUser = async (req, res) => {
//   try {
//     const user = await User.findByPk(req.params.email);
//     if (!user) return res.status(404).json({ error: 'User not found' });
//     await user.destroy();
//     res.json({ message: 'User deleted' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
