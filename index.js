const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// statyczne pliki (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// HOME
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'home.html'));
});


// CAR LOG UI
app.get('/car-log', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'car-log.html'));
});
// CAR LOG API
app.use('/api/car-log', require('./src/apps/car-log/car.routes'));

// API
app.get('/api/health', (req, res) => {
  res.json({
    status: '✅ Backend działa poprawnie'
  });
});

// fallback (na przyszłość SPA)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

