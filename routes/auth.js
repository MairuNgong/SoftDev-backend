const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

router.get("/", (req, res) => {
  res.send(`<a href="/auth/google">Login with Google</a>`);
});

router.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"]  // Request access to profile and email
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,            // Don't use sessions (we're using JWT)
    failureRedirect: '/'       // Redirect to home if authentication fails
  }),
  (req, res) => {
    // Create JWT token after successful authentication
    const payload = { email: req.user.email, name: req.user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN 
    });
    
    res.json({ token, user: payload });  // Send token to client
  }
);

router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Missing token' });

    const token = authHeader.split(' ')[1];  // Extract token from "Bearer <token>"
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token

    res.json({ user: decoded });  // Return user data from token
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;