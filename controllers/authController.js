const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

exports.loginPage = (req, res) => {
  res.send(`<a href="/auth/google">Login with Google</a>`);
};

exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"]
});

exports.googleCallback = [
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/'
  }),
  (req, res) => {
    const payload = { email: req.user.email, name: req.user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    const user = JSON.stringify(payload);
    res.redirect(`twinder://callback?token=${token}&user=${encodeURIComponent(user)}`);
  }
];

exports.profile = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Missing token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};