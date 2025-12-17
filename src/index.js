const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/car-log', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'car-log.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🐶 Jamnik Henryk uruchomił system');
});
