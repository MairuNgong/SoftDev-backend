const express = require('express');
const router = express.Router();
const User = require('../server/models/User');



app.get('/users', async (req, res) => {
  const users = await User.findAll();  // Sequelize method to get all records
  res.json(users);
});

app.get('/users/:email', async (req, res) => {
  const user = await User.findByPk(req.params.email);  // Find by primary key
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/users/:email', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update(req.body);  // Sequelize method to update record
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/users/:email', async (req, res) => {
  const user = await User.findByPk(req.params.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.destroy();  // Sequelize method to delete record
  res.json({ message: 'User deleted' });
});

module.exports = router;