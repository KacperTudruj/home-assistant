export const roundOne = value => Math.round((value + Number.EPSILON) * 10) / 10;
export const ordered = entries => [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

export function weightProgress(weights, goalKg) {
    const entries = ordered(weights);
    const first = entries[0] || null;
    const latest = entries.at(-1) || null;
    if (!first || !latest) return { first, latest, change: null, remaining: null, percent: 0, reached: false };
    if (goalKg === null) return { first, latest, change: roundOne(latest.kg - first.kg), remaining: null, percent: 0, reached: false };
    const difference = first.kg - goalKg;
    const reached = latest.kg <= goalKg;
    const percent = difference > 0
        ? Math.max(0, Math.min(100, ((first.kg - latest.kg) / difference) * 100))
        : (reached ? 100 : 0);
    return {
        first, latest, change: roundOne(latest.kg - first.kg),
        remaining: roundOne(Math.max(0, latest.kg - goalKg)), percent: Math.round(percent), reached,
    };
}

export function journeyProgress(distances, path) {
    const total = roundOne(distances.reduce((sum, entry) => sum + entry.km, 0));
    const stops = path.stops;
    const length = stops.at(-1).distance;
    const nextIndex = stops.findIndex(stop => stop.distance > total);
    const next = nextIndex === -1 ? null : stops[nextIndex];
    const current = next ? stops[nextIndex - 1] : stops.at(-1);
    return {
        total, percent: Math.min(100, Math.round(total / length * 100)),
        current, next, toNext: next ? roundOne(next.distance - total) : 0,
    };
}

export function filterWeights(weights, range, today = new Date()) {
    if (range === 'all') return ordered(weights);
    const from = new Date(today.getFullYear(), today.getMonth() - (range === 'month' ? 1 : 3), today.getDate());
    const fromKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
    return ordered(weights).filter(entry => entry.date >= fromKey);
}
