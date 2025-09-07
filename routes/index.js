const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send(`<a href="/auth">Hello</a>`);
});

module.exports = router;