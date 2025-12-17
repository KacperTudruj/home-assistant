fetch('/api/health')
  .then(res => res.json())
  .then(data => {
    document.getElementById('status').innerText = data.status;
  })
  .catch(() => {
    document.getElementById('status').innerText = '❌ Brak połączenia z API';
  });
