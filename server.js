const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const passport = require('./config/passport'); // ← FIXED: Import from config folderconst session = require('express-session');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const indexRoutes = require('./routes/index');
const session = require('express-session');

dotenv.config();
const app = express();

app.use(express.json());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());



//Routes




app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    // In your server.js:
    await sequelize.sync({ alter: true }); // Alters tables to match models // Creates tables if not exist
    console.log('Database connected ✅');
    console.log(`API running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('DB connection failed ❌', err);
  }
});
