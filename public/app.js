const henrykQuotes = [
  "Henryk melduje: wszystko działa, ale nie dotykaj kabli 🐾",
  "Jamnik Henryk tu był. Zostawił porządek. Prawie.",
  "Serwer działa. Henryk czuwa. 🌭",
  "Nie pytaj jak to działa. Henryk pilnuje.",
  "Jeśli to widzisz – znaczy, że Henryk pozwolił."
];

const el = document.getElementById('henryk-text');

if (el) {
  fetch('/api/commentary?feature=car-log')
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      el.innerText = data.text;
    })
    .catch(() => {
      el.innerText = "🐶 Henryk chwilowo milczy...";
    });
}
