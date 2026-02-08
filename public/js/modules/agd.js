export async function initAgd() {
    const container = document.getElementById("agd-devices-container");
    if (!container) return;

    container.innerHTML = '<div class="card"><p class="loading">Ładowanie urządzeń...</p></div>';

    try {
        const res = await fetch("/api/agd/devices");
        if (!res.ok) throw new Error("Błąd pobierania");
        const devices = await res.json();

        container.innerHTML = "";
        if (devices.length === 0) {
            container.innerHTML = '<div class="card"><p>Brak urządzeń AGD</p></div>';
            return;
        }

        devices.forEach(device => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <h3>${device.label || device.name}</h3>
                <div class="device-status">
                    Status: <span class="status-value">${device.status || 'Nieznany'}</span>
                </div>
                ${device.capabilities ? `<div class="capabilities">${device.capabilities.join(', ')}</div>` : ''}
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Błąd ładowania urządzeń AGD", err);
        container.innerHTML = '<div class="card"><p style="color:red">Błąd ładowania urządzeń</p></div>';
    }
}
