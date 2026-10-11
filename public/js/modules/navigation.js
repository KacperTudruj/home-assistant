export async function loadApps() {
    const panel = document.getElementById("apps-panel");
    if (!panel) return;

    try {
        const res = await fetch("/api/features");
        const features = await res.json();

        features.sort((a, b) => a.order - b.order);

        panel.innerHTML = "";
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

export function renderAppNav() {
    const root = document.getElementById("app-nav-root");
    if (!root) return;

    const pageType = document.body.dataset.page;
    const isAppPage = pageType === "app" || pageType === "car-fuel-history" || pageType === "car-analytics" || pageType === "smart-agd" || pageType === "camera" || pageType === "car-log";
    if (isAppPage) {
        const title = document.body.dataset.appTitle || "";
        root.innerHTML = `
            <nav class="app-nav">
                <a href="/" class="app-nav-back">Home</a>
                <span class="app-nav-separator">/</span>
                <span class="app-nav-title active">${title}</span>
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
