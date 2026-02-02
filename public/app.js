const commentaryEl = document.getElementById("commentary-text");
const commentatorSelect = document.getElementById("commentator-select");

const FEATURE_KEY = window.FEATURE_KEY || "app";
const DEFAULT_CAR_ID = "car_1"; // na razie mock

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

async function loadFuelHistory() {
  const container = document.getElementById("fuel-list-container");
  if (!container) return;

  try {
    const carId = DEFAULT_CAR_ID;
    const res = await fetch(`/api/cars/${carId}/fuels`);
    if (!res.ok) throw new Error("Failed to fetch fuel history");
    const fuels = await res.json();

    container.innerHTML = "";

    if (fuels.length === 0) {
      container.innerHTML = "<li>Brak danych o tankowaniach</li>";
      return;
    }

    fuels.forEach(fuel => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="fuel-main-info">
          <span class="fuel-date">${fuel.date}</span>
          <span class="fuel-liters">⛽ ${fuel.liters} l</span>
          <span class="fuel-price">${fuel.totalPrice} zł</span>
        </div>
        <div class="fuel-details">
          <span class="fuel-stats">
             ${fuel.fuelConsumptionPer100Km} l/100km · 
             ${fuel.costPer100Km} zł/100km · 
             ${fuel.mileageAtRefuelKm} km od ost.
          </span>
          <span class="fuel-meter">📍 ${fuel.meter} km</span>
        </div>
      `;
      container.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<li>Błąd ładowania danych</li>";
  }
}

document.addEventListener("DOMContentLoaded", loadApps);
document.addEventListener("DOMContentLoaded", renderAppNav);
document.addEventListener("DOMContentLoaded", loadFuelHistory);
