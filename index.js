const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// statyczne pliki (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
