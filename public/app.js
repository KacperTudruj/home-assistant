const henrykQuotes = [
  "Henryk melduje: wszystko działa, ale nie dotykaj kabli 🐾",
  "Jamnik Henryk tu był. Zostawił porządek. Prawie.",
  "Serwer działa. Henryk czuwa. 🌭",
  "Nie pytaj jak to działa. Henryk pilnuje.",
  "Jeśli to widzisz – znaczy, że Henryk pozwolił."
];

const el = document.getElementById('henryk-text');

if (el) {
  el.innerText = henrykQuotes[
    Math.floor(Math.random() * henrykQuotes.length)
  ];
}
// fetch('/api/health')
//   .then(res => res.json())
//   .then(data => {
//     document.getElementById('status').innerText = data.status;
//   })
//   .catch(() => {
//     document.getElementById('status').innerText = '❌ Brak połączenia z API';
//   });
