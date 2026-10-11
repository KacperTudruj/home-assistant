import { renderCharts } from './chart-renderer.js';

export async function initCarAnalytics() {
    const get = id => document.getElementById(`analytics-${id}`);
    const carId = new URLSearchParams(location.search).get('carId');
    if (!carId) { get('status').textContent = 'Najpierw wybierz samochód w widoku auta.'; return; }
    let version = 0, controller, dispose = () => {};
    const load = async () => {
        const current = ++version;
        controller?.abort(); controller = new AbortController();
        dispose(); get('results').hidden = true; get('retry').hidden = true;
        get('status').textContent = 'Ładowanie analizy…'; get('charts').setAttribute('aria-busy', 'true');
        try {
            const response = await fetch(`/api/cars/${encodeURIComponent(carId)}/analytics`, { signal: controller.signal, cache: 'no-store' });
            const payload = await response.json();
            if (current !== version) return;
            if (!response.ok) throw new Error(payload.error || 'Nie udało się pobrać analizy.');
            get('car').textContent = payload.car.name;
            get('results').hidden = false;
            dispose = renderCharts(get('charts'), payload.document);
            get('status').textContent = payload.analytics.pricePoints.length ? 'Analiza gotowa.' : 'Brak tankowań w wybranym zakresie.';
        } catch (error) {
            if (current !== version || error.name === 'AbortError') return;
            get('results').hidden = true;
            get('status').textContent = error.message || 'Błąd ładowania analizy.';
            get('retry').hidden = false;
        } finally { if (current === version) get('charts').setAttribute('aria-busy', 'false'); }
    };
    get('retry').addEventListener('click', () => load());
    window.addEventListener('pagehide', () => { version++; controller?.abort(); dispose(); });
    // A restored bfcache page has had its pending request and charts disposed.
    window.addEventListener('pageshow', event => { if (event.persisted) load(); });
    await load();
}
