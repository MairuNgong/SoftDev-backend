const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./db');
const User = require('./models/User');

dotenv.config();
const app = express();

app.use(express.json());

// Root route
app.get('/', (req, res) => res.send('Express + Postgres + Sequelize + Docker 🚀'));

// Create
app.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read all
app.get('/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// Read by ID
app.get('/users/:email', async (req, res) => {
  const user = await User.findByPk(req.params.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update
app.put('/users/:email', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
app.delete('/users/:email', async (req, res) => {
  const user = await User.findByPk(req.params.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.destroy();
  res.json({ message: 'User deleted' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Creates tables if not exist
    console.log('Database connected ✅');
    console.log(`API running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('DB connection failed ❌', err);
  }
});
