export async function loadApps() {
    const panel = document.getElementById("apps-panel");
    if (!panel) return;

    try {
        const res = await fetch("/api/features");
        if (!res.ok) throw new Error("Failed to fetch applications");
        const features = await res.json();

        features.sort((a, b) => a.order - b.order);

        panel.innerHTML = "";
        for (const feature of features) {
            const tile = document.createElement("a");
            tile.classList.add("app-tile");

            if (!feature.enabled) {
                tile.classList.add("disabled");
                tile.setAttribute("aria-disabled", "true");
            } else {
                tile.href = feature.route;
            }

            const icon = document.createElement("div");
            icon.className = "icon";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = feature.icon;

            const name = document.createElement("h3");
            name.className = "name";
            name.textContent = feature.name;

            const description = document.createElement("p");
            description.className = "desc";
            description.textContent = feature.description;

            const footer = document.createElement("div");
            footer.className = "tile-footer";
            const action = document.createElement("span");
            action.textContent = feature.enabled ? "Otwórz moduł" : "Niedostępne";
            const arrow = document.createElement("span");
            arrow.className = "tile-arrow";
            arrow.setAttribute("aria-hidden", "true");
            arrow.textContent = feature.enabled ? "↗" : "—";
            footer.append(action, arrow);

            tile.append(icon, name, description, footer);

            panel.appendChild(tile);
        }
        if (features.length === 0) {
            panel.innerHTML = '<p class="loading">Brak dostępnych aplikacji.</p>';
        }
    } catch (err) {
        console.error("Nie udało się załadować aplikacji", err);
        panel.innerHTML = '<p class="load-error" role="alert">Nie udało się załadować aplikacji. Odśwież stronę, aby spróbować ponownie.</p>';
    }
}

export function renderAppNav() {
    const root = document.getElementById("app-nav-root");
    if (!root) return;

    const pageType = document.body.dataset.page;
    const isAppPage = pageType === "app" || pageType === "car-fuel-history" || pageType === "car-analytics" || pageType === "smart-agd" || pageType === "camera" || pageType === "car-log" || pageType === "health";
    if (isAppPage) {
        const title = document.body.dataset.appTitle || "";
        root.innerHTML = `
            <nav class="app-nav" aria-label="Nawigacja okruszkowa">
                <a href="/" class="app-nav-back">Home</a>
                <span class="app-nav-separator">/</span>
                <span class="app-nav-title active" aria-current="page">${title}</span>
            </nav>
        `;
        if (pageType === 'car-analytics') {
            const nav = root.querySelector('nav');
            const current = nav.lastElementChild;
            const carId = new URLSearchParams(location.search).get('carId');
            const carLink = document.createElement('a');
            carLink.className = 'app-nav-back';
            carLink.textContent = '🚗 Car Log';
            carLink.href = carId ? `/car-log?carId=${encodeURIComponent(carId)}` : '/car-log';
            const separator = document.createElement('span');
            separator.className = 'app-nav-separator';
            separator.textContent = '/';
            nav.insertBefore(carLink, current);
            nav.insertBefore(separator, current);
        }
    }
}
