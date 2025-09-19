const User = require('../models/User');
const InterestedCatagory = require('../models/InterestedCatagory');
// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.findAll();
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

function extractCategories(body) {
    const { categoryNames } = body || {};
    if (Array.isArray(categoryNames)) {
        return categoryNames.filter(Boolean).map(s => String(s).trim()).filter(Boolean);
    }
    
    return null; // not provided at all
}

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

    const cats = extractCategories(req.body);
    if (cats !== null) {
      await InterestedCatagory.destroy({ where: { email: user.email } });
      if (cats.length > 0) {
        await InterestedCatagory.bulkCreate(
        cats.map(name => ({ email: user.email, categoryName: name }))
      );
      }
    }


    const updatedUser = await User.findByPk(user.email, {
      include: { model: InterestedCatagory, attributes: ['categoryName'] },
    });
    const plain = updatedUser.get({ plain: true });
    plain.InterestedCategories = plain.InterestedCategories.map(c => c.categoryName);
    res.json(plain);   
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
