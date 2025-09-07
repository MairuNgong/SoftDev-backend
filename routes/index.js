const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send(`<a href="/auth/google">Login with Google</a>`);
});

module.exports = router;