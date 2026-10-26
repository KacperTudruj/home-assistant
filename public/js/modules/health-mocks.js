// Dates are relative to the first visit so the demo remains useful after October 2026.
const daysAgo = days => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const paths = [
    {
        id: 'frodo',
        name: 'Ścieżka Froda — z Shire do Mordoru',
        description: 'Umowna trasa na potrzeby makiety. Dystanse i przystanki nie są zweryfikowanym kanonem.',
        stops: [
            { name: 'Shire', distance: 0 },
            { name: 'Bree', distance: 50 },
            { name: 'Rivendell', distance: 130 },
            { name: 'Moria', distance: 205 },
            { name: 'Lothlórien', distance: 280 },
            { name: 'Mordor', distance: 420 },
        ],
    },
];

export function createHealthMocks() {
    const weights = [
        [91, 112], [85, 111.6], [79, 111.8], [73, 110.9], [66, 110.2],
        [60, 110.2], [54, 109.5], [48, 109.9], [42, 108.7], [36, 108.1],
        [30, 108.1], [24, 107.3], [18, 106.5], [12, 106.9], [6, 105.7], [1, 105.2],
    ].map(([ago, kg], index) => ({ id: `mock-weight-${index}`, date: daysAgo(ago), kg, note: '' }));

    const distances = [
        [89, 4.2], [85, 6], [80, 5.5], [76, 8], [72, 4.8], [67, 7.2],
        [63, 5], [58, 6.5], [53, 8.4], [49, 4.1], [44, 9], [40, 6.2],
        [35, 7.3], [31, 5.6], [27, 8.2], [22, 7.4], [18, 6.8],
        [14, 9.1], [10, 5.2], [7, 7.8], [4, 6.4], [1, 8.5],
    ].map(([ago, km], index) => ({ id: `mock-distance-${index}`, date: daysAgo(ago), km, note: '' }));

    return { goalKg: 100, pathId: 'frodo', weights, distances };
}
