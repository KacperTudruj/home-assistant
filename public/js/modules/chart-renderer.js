const colors = ['#57e389', '#78bfff', '#ffc76b', '#ed9cff', '#ff9292', '#dbeb8c'];
const number = value => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value);
const date = value => new Date(value).toLocaleDateString('pl-PL', { timeZone: 'UTC' });

export function chartConfig(spec) {
    const dates = spec.series.flatMap(series => series.points.map(point => Date.parse(point.x)));
    const datasets = spec.series.map((series, index) => ({
        label: series.label,
        data: series.points.map(point => ({ x: Date.parse(point.x), y: point.y, details: point.details })),
        borderColor: colors[index % colors.length], backgroundColor: colors[index % colors.length],
        borderDash: index % 2 ? [6, 3] : [], pointStyle: ['circle', 'triangle', 'rect', 'crossRot'][index % 4],
        pointRadius: 3, pointHoverRadius: 6, borderWidth: 2, spanGaps: false,
    }));
    if (dates.length) for (const line of spec.referenceLines) datasets.push({
        label: line.label, data: [{ x: Math.min(...dates), y: line.value }, { x: Math.max(...dates), y: line.value }],
        borderColor: '#aebbb2', borderDash: [4, 4], pointRadius: 0, borderWidth: 1,
    });
    return {
        type: 'line', data: { datasets }, options: {
            responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
            interaction: { mode: 'nearest', intersect: false },
            scales: {
                x: { type: 'linear', title: { display: true, text: spec.xAxis.label, color: '#b4d3bd' },
                    ticks: { color: '#b4d3bd', maxTicksLimit: 5, callback: value => date(value) }, grid: { color: '#193824' } },
                y: { title: { display: true, text: spec.yAxis.unit, color: '#b4d3bd' },
                    ticks: { color: '#b4d3bd' }, grid: { color: '#193824' } },
            },
            plugins: {
                legend: { labels: { color: '#d0e8d8', usePointStyle: true } },
                tooltip: { callbacks: {
                    title: items => items.length ? date(items[0].parsed.x) : '',
                    label: item => `${item.dataset.label}: ${number(item.parsed.y)} ${spec.yAxis.unit}`,
                    afterLabel: item => (item.raw.details || []).map(detail => `${detail.label}: ${number(detail.value)} ${detail.unit}`),
                } },
            },
        },
    };
}

export function renderCharts(root, documentSpec, ChartClass = globalThis.Chart) {
    if (documentSpec.version !== 1) throw new Error('Nieobsługiwana wersja wykresów.');
    const instances = [];
    root.replaceChildren();
    const element = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
    try {
        for (const spec of documentSpec.charts) {
            const card = element('section'); card.className = 'card analytics-chart';
            card.append(element('h2', spec.title), element('p', spec.description));
            const valid = spec.series.some(series => series.points.some(point => point.y !== null));
            if (valid && ChartClass) {
                const holder = element('div'); holder.className = 'analytics-canvas';
                const canvas = element('canvas'); canvas.setAttribute('role', 'img');
                canvas.setAttribute('aria-label', `${spec.title}. Wartości dostępne w tabeli poniżej.`);
                holder.append(canvas); card.append(holder); root.append(card);
                instances.push(new ChartClass(canvas, chartConfig(spec)));
            } else card.append(element('p', valid ? 'Nie udało się załadować wykresu. Dane są dostępne w tabeli.' : 'Brak poprawnych danych do tego wykresu.'));
            const details = element('details'); details.append(element('summary', 'Pokaż dane w tabeli'));
            const scroll = element('div'); scroll.className = 'analytics-table-scroll';
            const table = element('table'); table.append(element('caption', `${spec.title} — ${spec.yAxis.unit}`));
            const head = element('thead'), header = element('tr');
            for (const title of ['Data', 'Seria', spec.yAxis.unit, 'Dodatkowe informacje']) {
                const th = element('th', title); th.scope = 'col'; header.append(th);
            }
            head.append(header); table.append(head);
            const body = element('tbody');
            for (const series of spec.series) for (const point of series.points) {
                const row = element('tr');
                for (const text of [date(point.x), series.label, point.y === null ? 'Brak danych' : number(point.y),
                    point.details.map(detail => `${detail.label}: ${number(detail.value)} ${detail.unit}`).join('; ')]) row.append(element('td', text));
                body.append(row);
            }
            table.append(body); scroll.append(table); details.append(scroll); card.append(details); root.append(card);
        }
    } catch (error) { instances.forEach(instance => instance.destroy()); root.replaceChildren(); throw error; }
    return () => { instances.forEach(instance => instance.destroy()); root.replaceChildren(); };
}
