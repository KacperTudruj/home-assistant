const commentaryEl = document.getElementById("commentary-text");
const commentatorSelect = document.getElementById("commentator-select");

const FEATURE_KEY = window.FEATURE_KEY || "app";

if (commentaryEl && commentatorSelect) {
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
}

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

  // ⛔ JEŚLI NIE MA HEADERA — NIE RÓB NIC
  if (!commentaryEl || !commentatorSelect) {
    console.warn("Commentary header not present on this page");
    return;
  }
}

async function loadApps() {
  console.log("loadApps() fired"); // 👈 DEBUG
  const panel = document.getElementById("apps-panel");
  if (!panel) return;

  try {
    const res = await fetch("/api/features");
    const features = await res.json();

    // sortowanie (opcjonalne, ale ładne)
    features.sort((a, b) => a.order - b.order);

    for (const feature of features) {
      const tile = document.createElement("a");
      tile.classList.add("app-tile");

      if (!feature.enabled) {
        tile.classList.add("disabled");
        tile.href = "#";
      } else {
        tile.href = feature.route;
      }

      tile.innerHTML = `
        <div class="icon">${feature.icon}</div>
        <div class="name">${feature.name}</div>
        <div class="desc">${feature.description}</div>
      `;

      panel.appendChild(tile);
    }
  } catch (err) {
    console.error("Nie udało się załadować aplikacji", err);
    panel.innerHTML = "<p>Błąd ładowania aplikacji</p>";
  }
}

function renderAppNav() {
  const root = document.getElementById("app-nav-root");
  if (!root) return;

  const pageType = document.body.dataset.page;

  if (pageType !== "app") {
    return;
  }

  const title = document.body.dataset.appTitle || "";

  root.innerHTML = `
  <nav class="app-nav">
    <a href="/" class="app-nav-back">Home</a>
    <span class="app-nav-separator">/</span>
    <span class="app-nav-title active">${title}</span>
  </nav>
`;

}
document.addEventListener("DOMContentLoaded", loadApps);
document.addEventListener("DOMContentLoaded", renderAppNav);
