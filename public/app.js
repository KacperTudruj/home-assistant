const commentaryEl = document.getElementById("commentary-text");
const commentatorSelect = document.getElementById("commentator-select");

const FEATURE_KEY = window.FEATURE_KEY || "app";

// ====== CAR LOG LOGIC ======
const carOverlay = document.getElementById("car-selection-overlay");
const carListEl = document.getElementById("car-selection-list");
const changeCarBtn = document.getElementById("change-car-btn");

if (carOverlay && carListEl) {
  initCarLog();
}

async function initCarLog() {
  const savedCarId = localStorage.getItem("selectedCarId");
  if (savedCarId) {
    loadCarData(savedCarId);
  } else {
    showCarSelection();
  }

  if (changeCarBtn) {
    changeCarBtn.addEventListener("click", showCarSelection);
  }
}

async function showCarSelection() {
  carOverlay.classList.remove("hidden");
  carListEl.innerHTML = "<li>Ładowanie samochodów...</li>";

  try {
    const res = await fetch("/api/cars");
    const cars = await res.json();
    carListEl.innerHTML = "";

    cars.forEach(car => {
      const li = document.createElement("li");
      li.className = "car-selection-item";
      li.innerHTML = `
        <span class="car-name">${car.name}</span>
        <span class="car-year">${car.year}</span>
      `;
      li.onclick = () => selectCar(car.id);
      carListEl.appendChild(li);
    });
  } catch (err) {
    console.error("Błąd ładowania listy aut", err);
    carListEl.innerHTML = "<li>Błąd ładowania listy</li>";
  }
}

function selectCar(carId) {
  localStorage.setItem("selectedCarId", carId);
  carOverlay.classList.add("hidden");
  loadCarData(carId);
}

async function loadCarData(carId) {
  try {
    const res = await fetch(`/api/cars/${carId}`);
    if (!res.ok) throw new Error("Car not found");
    const car = await res.json();

    // Update UI
    document.getElementById("car-name-display").textContent = car.name;
    document.getElementById("car-year-display").textContent = `(${car.year})`;
    document.getElementById("info-model").textContent = car.name;
    document.getElementById("info-year").textContent = car.year;

    if (car.mileage) {
      document.getElementById("mileage-purchase").textContent = `${car.mileage.atPurchase.toLocaleString()} km`;
      document.getElementById("mileage-current").textContent = `${car.mileage.current.toLocaleString()} km`;
      document.getElementById("mileage-owned").textContent = `${car.mileage.ownedDistance.toLocaleString()} km`;
    }

    // Load fuel history for this car
    loadFuelHistory(carId);

  } catch (err) {
    console.error("Błąd ładowania danych auta", err);
    localStorage.removeItem("selectedCarId");
    showCarSelection();
  }
}

async function loadFuelHistory(carId) {
  const container = document.getElementById("fuel-list-container");
  if (!container) return;

  container.innerHTML = '<li class="loading">Ładowanie tankowań...</li>';

  try {
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
