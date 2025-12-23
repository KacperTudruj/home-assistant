const commentaryEl = document.getElementById("commentary-text");
const commentatorSelect = document.getElementById("commentator-select");

const FEATURE_KEY = "app";

// ====== LOAD COMMENTATORS ======
fetch("/api/commentators")
  .then(res => res.json())
  .then(commentators => {
    commentators.forEach(c => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = c.name;
      commentatorSelect.appendChild(option);
    });

    const saved = localStorage.getItem("commentatorId");
    if (saved) {
      commentatorSelect.value = saved;
      loadCommentary(saved);
    }
  })
  .catch(err => {
    console.error("Błąd ładowania komentatorów", err);
  });

// ====== CHANGE COMMENTATOR ======
commentatorSelect.addEventListener("change", () => {
  const id = commentatorSelect.value;
  if (!id) return;

  localStorage.setItem("commentatorId", id);
  loadCommentary(id);
});

// ====== LOAD COMMENTARY ======
function loadCommentary(commentatorId) {
  commentaryEl.innerText = "🗣️ Myślę…";

  fetch(`/api/commentary?feature=${FEATURE_KEY}&commentatorId=${commentatorId}`)
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      commentaryEl.innerText = data.text;
    })
    .catch(() => {
      commentaryEl.innerText = "🤐 Komentator dziś milczy...";
    });
}
