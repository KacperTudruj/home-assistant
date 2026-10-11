import { renderCharts } from './chart-renderer.js';

export function dateRange(months, now = new Date()) {
    const to = now.toISOString().slice(0, 10);
    const from = new Date(`${to}T00:00:00Z`);
    const day = from.getUTCDate();
    from.setUTCDate(1);
    from.setUTCMonth(from.getUTCMonth() - months);
    const lastDay = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0)).getUTCDate();
    from.setUTCDate(Math.min(day, lastDay));
    return { from: from.toISOString().slice(0, 10), to };
}

export async function initCarAnalytics() {
    const get = id => document.getElementById(`analytics-${id}`);
    const carId = new URLSearchParams(location.search).get('carId');
    if (!carId) { get('status').textContent = 'Najpierw wybierz samochód w widoku auta.'; get('filters').hidden = true; return; }
    get('back').href = `/car-log?carId=${encodeURIComponent(carId)}`;
    let version = 0, controller, dispose = () => {}, lastQuery;
    const preset = () => {
        if (get('period').value === 'custom') return;
        const range = dateRange(Number(get('period').value));
        get('from').value = range.from; get('to').value = range.to;
    };
    preset();
    get('period').addEventListener('change', preset);
    for (const field of ['from', 'to']) get(field).addEventListener('input', () => { get('period').value = 'custom'; });

    const load = async query => {
        lastQuery = query;
        const current = ++version;
        controller?.abort(); controller = new AbortController();
        dispose(); get('results').hidden = true; get('retry').hidden = true;
        get('status').textContent = 'Ładowanie analizy…'; get('charts').setAttribute('aria-busy', 'true');
        try {
            const response = await fetch(`/api/cars/${encodeURIComponent(carId)}/analytics?${query}`, { signal: controller.signal, cache: 'no-store' });
            const payload = await response.json();
            if (current !== version) return;
            if (!response.ok) throw new Error(payload.error || 'Nie udało się pobrać analizy.');
            get('car').textContent = payload.car.name;
            get('generated').textContent = `Obliczono: ${new Date(payload.generatedAt).toLocaleString('pl-PL')}`;
            const filter = payload.analytics.filter;
            get('range').textContent = `Wyświetlane dane: ${filter.from} – ${filter.to}, ${filter.fuelType}. Ceny litra: wszystkie paliwa.`;
            const skipped = payload.analytics.skipped;
            const messages = [`Brak wyniku: spalanie ${skipped.consumption}, koszt/100 km ${skipped.costPer100Km}, porównanie ${skipped.improvement}, cena litra ${skipped.pricePerLiter}.`];
            if (payload.analytics.warnings.includes('MULTIPLE_FUELS')) messages.push('Historia zawiera różne paliwa. Nie sumujemy spalania ani kosztu przejazdu paliw używanych równolegle.');
            if (payload.analytics.warnings.includes('ELECTRIC_NOT_SUPPORTED')) messages.push('Dane elektryczne nie mają metryk w litrach.');
            get('quality').textContent = messages.join(' ');
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
    const query = () => new URLSearchParams({ from: get('from').value, to: get('to').value, fuelType: get('fuel').value }).toString();
    get('filters').addEventListener('submit', event => {
        event.preventDefault();
        if (!get('filters').reportValidity()) return;
        if (get('from').value > get('to').value) { get('status').textContent = 'Data początkowa nie może być późniejsza niż końcowa.'; return; }
        load(query());
    });
    get('retry').addEventListener('click', () => load(lastQuery));
    window.addEventListener('pagehide', () => { version++; controller?.abort(); dispose(); });
    // A restored bfcache page has had its pending request and charts disposed.
    window.addEventListener('pageshow', event => { if (event.persisted) load(lastQuery); });
    await load(query());
}
