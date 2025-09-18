const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const passport = require('./config/passport');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const indexRoutes = require('./routes/index');
const itemRoutes = require('./routes/item');
const transactionRoutes = require('./routes/transaction');
const interestedCatagoryRoutes = require('./routes/interestedCatagory');
const itemCatagoryRoutes = require('./routes/itemCatagory');

dotenv.config();
const app = express();

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_do_not_use_in_prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/items', itemRoutes);
app.use('/interested-catagory', interestedCatagoryRoutes);
app.use('/item-catagory', itemCatagoryRoutes);
app.use('/transactions', transactionRoutes);

const PORT = process.env.INSIDE_PORT || 5000;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected ✅');
    console.log(`API running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('DB connection failed ❌', err);
  }
});
