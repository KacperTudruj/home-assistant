const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GetCarAnalyticsUseCase } = require('../../../../src/modules/car/application/GetCarAnalyticsUseCase');
const { GenerateFuelChartsUseCase } = require('../../../../src/modules/car/application/GenerateFuelChartsUseCase');
const { LocalChartGenerator } = require('../../../../src/modules/charts/application/LocalChartGenerator');
const { MemoryCarAnalyticsCache } = require('../../../../src/modules/car/infrastructure/MemoryCarAnalyticsCache');
const { AnalyticsLimitError, AnalyticsNotFoundError } = require('../../../../src/modules/car/domain/repository/CarAnalyticsRepository');
const { InvalidFuelAnalyticsInputError } = require('../../../../src/modules/car/domain/FuelAnalyticsCalculator');

const query = { from: '2026-01-01', to: '2026-10-11', fuelType: 'PB95' };
function setup(read = async () => ({ car: { id: 'car', name: 'Car' }, records: [], availableFuelTypes: ['LPG'] })) {
    const cache = new MemoryCarAnalyticsCache();
    const counts = { reads: 0, generations: 0 };
    const useCase = new GetCarAnalyticsUseCase({ read: async (...args) => { counts.reads++; return read(...args); } },
        new GenerateFuelChartsUseCase({ generate: async input => {
            counts.generations++; return new LocalChartGenerator().generate(input);
        } }), cache, () => new Date('2026-10-11T10:00:00Z'));
    return { cache, counts, useCase };
}

test('returns empty analytics with car metadata and the complete fuel catalog in one cached operation', async () => {
    //Given
    const { useCase, counts } = setup();
    //When
    const first = await useCase.execute('car', query);
    const second = await useCase.execute('car', query);
    //Then
    assert.deepEqual(second, first);
    assert.deepEqual(counts, { reads: 1, generations: 1 });
    assert.equal(first.document.charts.length, 4);
    assert.equal(first.generatedAt, '2026-10-11T10:00:00.000Z');
    assert.deepEqual(first.analytics.availableFuelTypes, ['LPG']);
});

test('normalizes omitted filters and preserves explicit date range boundaries', async () => {
    //Given
    let received;
    const { useCase, counts } = setup(async (id, filter) => {
        received = filter;
        return { car: { id, name: 'Car' }, records: [], availableFuelTypes: [] };
    });
    //When
    await useCase.execute('car', {});
    await useCase.execute('car', { from: '2025-10-11', to: '2026-10-11', fuelType: 'PB95' });
    //Then
    assert.deepEqual(received, { from: '2025-10-11', to: '2026-10-11', fuelType: 'PB95' });
    assert.equal(counts.reads, 1);
});

for (const invalid of [{ from: '2026-01-01' }, { from: '2026-02-30', to: '2026-10-11' },
    { ...query, from: ['2026-01-01'] }, { ...query, to: '2025-01-01' }, { fuelType: 'unknown' }]) {
    test(`rejects invalid query before reading data: ${JSON.stringify(invalid)}`, async () => {
        //Given
        const { useCase, counts } = setup();
        //When
        const run = () => useCase.execute('car', invalid);
        //Then
        await assert.rejects(run, InvalidFuelAnalyticsInputError);
        assert.equal(counts.reads, 0);
    });
}

test('enforces the five-year range limit', async () => {
    //Given
    const { useCase } = setup();
    //When
    const run = () => useCase.execute('car', { from: '2020-01-01', to: '2025-01-02' });
    //Then
    await assert.rejects(run, AnalyticsLimitError);
    await useCase.execute('car', { from: '2020-01-01', to: '2025-01-01' });
});

test('reports missing cars and retries the repository after errors', async () => {
    //Given
    const { useCase, counts } = setup(async () => null);
    //When
    const run = () => useCase.execute('missing', query);
    //Then
    await assert.rejects(run, AnalyticsNotFoundError);
    await assert.rejects(run, AnalyticsNotFoundError);
    assert.equal(counts.reads, 2);
});

test('rejects excessive visible series before invoking the generator', async () => {
    //Given
    const { useCase, counts } = setup(async () => ({ car: { id: 'car', name: 'Car' }, availableFuelTypes: ['PB95'],
        records: Array.from({ length: 1001 }, (_, id) => ({ id: String(id), date: '2026-01-01', fuelType: 'PB95' })) }));
    //When
    const run = () => useCase.execute('car', query);
    //Then
    await assert.rejects(run, AnalyticsLimitError);
    assert.equal(counts.generations, 0);
});

test('invalidates calculations after a backdated fuel insertion', async () => {
    //Given
    const records = [{ id: '2', date: '2026-02-01', fuelType: 'PB95', liters: 40, totalPrice: 240, mileageAtRefuelKm: 2000, tripDistance: null }];
    const { useCase, cache } = setup(async () => ({ car: { id: 'car', name: 'Car' }, records, availableFuelTypes: ['PB95'] }));
    const first = await useCase.execute('car', query);
    //When
    records.push({ ...records[0], id: '1', date: '2026-01-01', mileageAtRefuelKm: 1500 });
    cache.invalidate('car');
    const second = await useCase.execute('car', query);
    //Then
    assert.equal(first.analytics.points[0].consumption, null);
    assert.equal(second.analytics.points[1].consumption, 8);
});

test('concurrent identical requests share both the repository and generator', async () => {
    //Given
    const { useCase, counts } = setup();
    //When
    const results = await Promise.all([useCase.execute('car', query), useCase.execute('car', query)]);
    //Then
    assert.deepEqual(results[0], results[1]);
    assert.deepEqual(counts, { reads: 1, generations: 1 });
});

test('clamps the default leap-day range and accepts four-digit year boundaries', async () => {
    //Given
    const source = { car: { id: 'car', name: 'Car' }, records: [], availableFuelTypes: [] };
    const useCase = new GetCarAnalyticsUseCase({ read: async () => source },
        new GenerateFuelChartsUseCase(new LocalChartGenerator()), new MemoryCarAnalyticsCache(),
        () => new Date('2024-02-29T12:00:00Z'));
    //When
    const leap = await useCase.execute('car', {});
    const boundary = await useCase.execute('car', { from: '9999-01-01', to: '9999-12-31' });
    //Then
    assert.equal(leap.analytics.filter.from, '2023-02-28');
    assert.equal(boundary.analytics.filter.to, '9999-12-31');
});
