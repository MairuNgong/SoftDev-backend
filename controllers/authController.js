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


exports.devToken = (req, res) => {
  // For dev: use query params or defaults
  const email = req.query.email;
  const name = req.query.name;
  const payload = { email, name };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
  res.json({ token, user: payload });
};
