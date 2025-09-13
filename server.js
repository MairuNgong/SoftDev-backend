const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const passport = require('./config/passport'); // ← FIXED: Import from config folderconst session = require('express-session');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const indexRoutes = require('./routes/index');
const itemRoutes = require('./routes/item');
const session = require('express-session');
const { User, InterestedCatagory, Blocked, ImagePicture, Item, ItemCatagory, Message, Rating, TradeItem, WatchedItem } = require('./models');

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


app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/items', itemRoutes);

// Start server
const PORT = process.env.INSIDE_PORT;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // ⚠️ drops all tables then recreates
    console.log('Database connected ✅');
    console.log(`API running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('DB connection failed ❌', err);
  }
});
