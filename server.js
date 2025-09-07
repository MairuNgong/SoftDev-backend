const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const passport = require('./config/passport'); // ← FIXED: Import from config folderconst session = require('express-session');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const session = require('express-session');

dotenv.config();
const app = express();


app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());




//Routes

app.use(express.json());



app.use('/auth', authRoutes);
app.use('/users', userRoutes);
// app.get("/", (req, res) => {
//   res.send(`<a href="/auth/google">Login with Google</a>`);
// });

// app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google callback
// app.get('/auth/google/callback', 
//   passport.authenticate('google', { session: false, failureRedirect: '/' }),
//   (req, res) => {
//     // Create JWT
//     const payload = { email: req.user.email, name: req.user.name };
//     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
//     // Send JWT to client
//     res.json({ token, user: payload });
//   }
// );

// Protected route example
// app.get('/profile', async (req, res) => {
//   try {
//     const authHeader = req.headers['authorization'];
//     if (!authHeader) return res.status(401).json({ error: 'Missing token' });

//     const token = authHeader.split(' ')[1]; // Bearer <token>
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     res.json({ user: decoded });
//   } catch (err) {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// });

// Read all
// app.get('/users', async (req, res) => {
//   const users = await User.findAll();
//   res.json(users);
// });

// Read by ID
// app.get('/users/:email', async (req, res) => {
//   const user = await User.findByPk(req.params.email);
//   if (!user) return res.status(404).json({ error: 'User not found' });
//   res.json(user);
// });

// Update
// app.put('/users/:email', async (req, res) => {
//   try {
//     const user = await User.findByPk(req.params.email);
//     if (!user) return res.status(404).json({ error: 'User not found' });
//     await user.update(req.body);
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Delete
// app.delete('/users/:email', async (req, res) => {
//   const user = await User.findByPk(req.params.email);
//   if (!user) return res.status(404).json({ error: 'User not found' });
//   await user.destroy();
//   res.json({ message: 'User deleted' });
// });

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
