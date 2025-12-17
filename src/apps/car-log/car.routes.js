const express = require('express');
const router = express.Router();

router.get('/log', (req, res) => {
  res.json({
    message: 'Henryk widzi twoje logi 🚗'
  });
});

module.exports = router;