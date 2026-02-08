export async function initCarLog() {
    const carOverlay = document.getElementById("car-selection-overlay");
    const carListEl = document.getElementById("car-selection-list");
    const changeCarBtn = document.getElementById("change-car-btn");
    const addFuelBtn = document.getElementById("add-fuel-btn");
    const addFuelForm = document.getElementById("add-fuel-form");

    const savedCarId = localStorage.getItem("selectedCarId");
    if (savedCarId) {
        loadCarData(savedCarId);
    } else {
        showCarSelection(carOverlay, carListEl);
    }

    if (changeCarBtn) {
        changeCarBtn.addEventListener("click", () => showCarSelection(carOverlay, carListEl));
    }
    if (addFuelBtn) {
        addFuelBtn.addEventListener("click", openAddFuelModal);
    }
    if (addFuelForm) {
        addFuelForm.addEventListener("submit", submitAddFuelForm);
        const cancelBtn = document.getElementById("cancel-add-fuel");
        if (cancelBtn) cancelBtn.addEventListener("click", closeAddFuelModal);
    }
}

async function showCarSelection(carOverlay, carListEl) {
    if (!carOverlay || !carListEl) return;
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
            li.onclick = () => {
                localStorage.setItem("selectedCarId", car.id);
                carOverlay.classList.add("hidden");
                loadCarData(car.id);
            };
            carListEl.appendChild(li);
        });
    } catch (err) {
        console.error("Błąd ładowania listy aut", err);
        carListEl.innerHTML = "<li>Błąd ładowania listy</li>";
    }
}

async function loadCarData(carId) {
    try {
        const res = await fetch(`/api/cars/${carId}`);
        if (!res.ok) throw new Error("Car not found");
        const car = await res.json();

        // Update UI
        setText("car-name-display", car.name);
        setText("car-year-display", `(${car.year})`);
        setText("info-model", car.name);
        setText("info-year", car.year);
        setText("info-engine", car.engine || "Brak danych");
        setText("info-vin", car.vin || "Brak danych");

        const statusEl = document.querySelector(".car-status");
        if (statusEl) {
            statusEl.textContent = car.isActive ? "AKTYWNE" : "NIEAKTYWNE";
            statusEl.className = `car-status ${car.isActive ? 'active' : 'inactive'}`;
        }

        const addFuelBtn = document.getElementById("add-fuel-btn");
        if (addFuelBtn) {
            addFuelBtn.disabled = !car.isActive;
            addFuelBtn.title = car.isActive ? "" : "To auto jest nieaktywne";
            addFuelBtn.classList.toggle("disabled", !car.isActive);
        }

        if (car.mileage) {
            setText("mileage-purchase", `${(car.mileage.atPurchase || 0).toLocaleString()} km`);
            setText("mileage-current", `${(car.mileage.current || 0).toLocaleString()} km`);
            const owned = car.mileage.ownedDistance > 0 ? car.mileage.ownedDistance : 0;
            setText("mileage-owned", `${owned.toLocaleString()} km`);
        }

        // Load fuel history for this car
        loadFuelHistory(carId);
        // Load statistics
        loadCarStatistics(carId);

    } catch (err) {
        console.error("Błąd ładowania danych auta", err);
        localStorage.removeItem("selectedCarId");
        showCarSelection(document.getElementById("car-selection-overlay"), document.getElementById("car-selection-list"));
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

async function loadFuelHistory(carId) {
    const container = document.getElementById("fuel-list-container");
    if (!container) return;

    container.innerHTML = '<li class="loading">Ładowanie tankowań...</li>';

    try {
        const res = await fetch(`/api/cars/${carId}/fuels?limit=5`);
        if (!res.ok) throw new Error("Failed to fetch fuel history");
        const fuels = await res.json();

        container.innerHTML = "";
        if (fuels.length === 0) {
            container.innerHTML = "<li>Brak danych o tankowaniach</li>";
            return;
        }

        fuels.forEach(fuel => {
            const li = document.createElement("li");
            const modeLabels = { 'MIXED': '🔄', 'CITY': '🏙️', 'HIGHWAY': '🛣️' };
            const modeLabel = modeLabels[fuel.drivingMode] || '';
            
            let stats = fuel.mileageAtRefuelKm 
                ? `${fuel.fuelConsumptionPer100Km || '?.??'} l/100km · ${fuel.costPer100Km || '?.??'} zł/100km · ${fuel.mileageAtRefuelKm} km od ost.`
                : '';
            if (fuel.tripDistance) {
                if (stats) stats += ' · ';
                stats += `trip: ${fuel.tripDistance} km`;
            }

            li.innerHTML = `
                <div class="fuel-main-info">
                  <span class="fuel-date">${fuel.date}</span>
                  <span class="fuel-liters">⛽ ${fuel.liters} l ${modeLabel}</span>
                  <span class="fuel-price">${fuel.totalPrice.toFixed(2)} zł</span>
                </div>
                ${stats ? `<div class="fuel-stats">${stats}</div>` : ''}
            `;
            container.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<li style="color:red">Błąd ładowania historii</li>';
    }
}

async function loadCarStatistics(carId) {
    const avgPriceEl = document.getElementById("stats-avg-price");
    if (!avgPriceEl) return;

    try {
        const res = await fetch(`/api/cars/${carId}/fuel/statistics`);
        if (!res.ok) throw new Error("Failed to fetch statistics");
        const stats = await res.json();

        avgPriceEl.textContent = `${stats.overallAvgPricePerLiter.toFixed(2)} zł/L`;
        
        const setModeValue = (id, modeKey) => {
            const el = document.getElementById(id);
            if (!el) return;
            const m = stats.avgConsumptionPerDrivingMode?.find(x => x.drivingMode === modeKey);
            if (m && m.avgConsumption) {
                el.innerHTML = `
                    <div>${m.avgConsumption.toFixed(2)} <small>l/100km</small></div>
                    <div style="font-size: 0.8em; opacity: 0.8;">${m.avgCost ? m.avgCost.toFixed(2) : '---'} <small>zł/100km</small></div>
                `;
            } else {
                el.textContent = "---";
            }
        };

        setModeValue('stats-city', 'CITY');
        setModeValue('stats-highway', 'HIGHWAY');
        setModeValue('stats-mixed', 'MIXED');

        setText("stats-avg-cost", stats.overallAvgCostPer100Km ? `${stats.overallAvgCostPer100Km.toFixed(2)} zł/100km` : "---");
        setText("stats-avg-liters", `${stats.overallAvgLitersPerRefuel.toFixed(2)} L`);
        setText("stats-total-liters", `${stats.overallTotalLiters.toLocaleString()} L`);
        setText("stats-total-cost", `${stats.overallTotalSpent.toLocaleString()} zł`);

        const yearlyListEl = document.getElementById("stats-yearly");
        if (yearlyListEl) {
            yearlyListEl.innerHTML = "";
            const years = stats.avgPricePerLiterPerYear.map(y => y.year).reverse();
            years.forEach(year => {
                const avgPrice = stats.avgPricePerLiterPerYear.find(y => y.year === year)?.avgPricePerLiter;
                const totalSpent = stats.totalSpentPerYear.find(y => y.year === year)?.totalSpent;
                const li = document.createElement("li");
                li.className = "stats-yearly-item";
                li.innerHTML = `
                    <span class="year-label">${year}</span>
                    <span class="year-value">${totalSpent.toLocaleString()} zł</span>
                    <span class="year-subvalue">śr. ${avgPrice.toFixed(2)} zł/L</span>
                `;
                yearlyListEl.appendChild(li);
            });
        }
    } catch (err) {
        console.error("Błąd ładowania statystyk", err);
    }
}

function openAddFuelModal() {
    document.getElementById("add-fuel-overlay")?.classList.remove("hidden");
}

function closeAddFuelModal() {
    document.getElementById("add-fuel-overlay")?.classList.add("hidden");
}

async function submitAddFuelForm(e) {
    e.preventDefault();
    const carId = localStorage.getItem("selectedCarId");
    if (!carId) return;

    const getValue = (id) => document.getElementById(id).value.replace(',', '.');
    
    const payload = {
        date: document.getElementById("fuel-date").value,
        liters: parseFloat(getValue("fuel-liters")),
        meter: parseFloat(getValue("fuel-meter")),
        tripDistance: parseFloat(getValue("fuel-trip")) || null,
        totalPrice: parseFloat(getValue("fuel-total-price")),
        fuelPricePerLiter: parseFloat(getValue("fuel-price-per-liter")),
        fuelType: "PB95",
        drivingMode: document.getElementById("fuel-driving-mode")?.value || "MIXED"
    };

    try {
        const res = await fetch(`/api/cars/${carId}/fuel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Błąd zapisu");
        closeAddFuelModal();
        await loadCarData(carId);
        e.target.reset();
    } catch (err) {
        alert("Błąd: " + err.message);
    }
}

// Full History Logic
let currentHistoryPage = 1;

export async function initFullFuelHistory() {
    const carId = localStorage.getItem("selectedCarId");
    if (!carId) {
        window.location.href = "/car-log.html";
        return;
    }

    loadFullFuelHistory(carId, currentHistoryPage);

    const prevBtn = document.getElementById("fuel-prev");
    const nextBtn = document.getElementById("fuel-next");

    if (prevBtn) prevBtn.onclick = () => {
        if (currentHistoryPage > 1) {
            currentHistoryPage--;
            loadFullFuelHistory(carId, currentHistoryPage);
        }
    };
    if (nextBtn) nextBtn.onclick = () => {
        currentHistoryPage++;
        loadFullFuelHistory(carId, currentHistoryPage);
    };
}

async function loadFullFuelHistory(carId, page = 1) {
    const tableBody = document.querySelector("#fuel-history-table tbody");
    const pageInfo = document.getElementById("fuel-page-info");
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center">Ładowanie...</td></tr>';

    try {
        const res = await fetch(`/api/cars/${carId}/fuels?page=${page}&pageSize=15`);
        if (!res.ok) throw new Error("Błąd pobierania");
        const data = await res.json();

        tableBody.innerHTML = "";
        if (data.items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center">Brak rekordów</td></tr>';
        }

        data.items.forEach(fuel => {
            const tr = document.createElement("tr");
            const modeLabels = { 'MIXED': '🔄', 'CITY': '🏙️', 'HIGHWAY': '🛣️' };
            tr.innerHTML = `
                <td>${fuel.date}</td>
                <td>${fuel.meter}</td>
                <td>${fuel.tripDistance || '---'}</td>
                <td>${fuel.liters}</td>
                <td>${fuel.totalPrice.toFixed(2)}</td>
                <td>${fuel.fuelPricePerLiter.toFixed(2)}</td>
                <td>${fuel.fuelConsumptionPer100Km || '---'}</td>
                <td>${fuel.costPer100Km || '---'}</td>
                <td style="text-align:center">${modeLabels[fuel.drivingMode] || fuel.drivingMode}</td>
            `;
            tableBody.appendChild(tr);
        });

        if (pageInfo) {
            pageInfo.textContent = `Strona ${data.page} z ${Math.ceil(data.total / data.pageSize) || 1}`;
        }

        const prevBtn = document.getElementById("fuel-prev");
        const nextBtn = document.getElementById("fuel-next");
        if (prevBtn) prevBtn.disabled = data.page <= 1;
        if (nextBtn) nextBtn.disabled = data.page >= Math.ceil(data.total / data.pageSize);

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:red">Błąd ładowania danych</td></tr>';
    }
}
