const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CarAnalyticsRepositoryPrisma } = require('../../../../src/modules/car/infrastructure/CarAnalyticsRepositoryPrisma');
const { FuelAnalyticsCalculator } = require('../../../../src/modules/car/domain/FuelAnalyticsCalculator');
const { AnalyticsLimitError } = require('../../../../src/modules/car/domain/repository/CarAnalyticsRepository');

const filter = { from: '2026-01-01', to: '2026-01-31', fuelType: 'PB95' };
const row = (id, date, overrides = {}) => ({ id: String(id), date: new Date(date), fuelType: 'PB95',
    liters: 40, totalPrice: 240, mileageAtRefuelKm: 1000 + id * 500, tripDistance: null, ...overrides });
function setup(rows, exists = true) {
    const calls = [];
    let isolation;
    const tx = {
        car: { findUnique: async () => exists ? { id: 'car', name: 'Car' } : null },
        fuelRecord: {
            groupBy: async () => [...new Set(rows.map(row => row.fuelType))].map(fuelType => ({ fuelType })),
            findMany: async args => {
                calls.push(args);
                const where = args.where;
                return rows.filter(row => (!where.date.gte || row.date >= where.date.gte) && row.date < where.date.lt &&
                    (!where.OR || row.date < where.OR[0].date.lt || (+row.date === +where.OR[1].date && row.id < where.OR[1].id.lt)))
                    .sort((a, b) => (args.orderBy[0].date === 'asc' ? 1 : -1) *
                        (+a.date - +b.date || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)))
                    .slice(0, args.take);
            },
        },
    };
    const prisma = { $transaction: async (run, options) => { isolation = options.isolationLevel; return run(tx); } };
    return { repository: new CarAnalyticsRepositoryPrisma(prisma), calls, isolation: () => isolation };
}

test('uses inclusive UTC dates, a snapshot and a bounded context query without N+1 reads', async () => {
    //Given
    const rows = Array.from({ length: 200 }, (_, index) => row(index + 1,
        new Date(Date.UTC(2025, 5, 1 + index)).toISOString()));
    rows.push(row(201, '2026-01-01'), row(202, '2026-01-31T23:59:59Z'), row(203, '2026-02-01', { fuelType: 'LPG' }));
    const { repository, calls, isolation } = setup(rows);
    //When
    const result = await repository.read('car', filter);
    const points = new FuelAnalyticsCalculator().calculate(result.records, filter).points;
    const fullPoints = new FuelAnalyticsCalculator().calculate(rows.map(row => ({ ...row, date: row.date.toISOString().slice(0, 10) })), filter).points;
    //Then
    assert.equal(isolation(), 'RepeatableRead');
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.where.carId === 'car'));
    assert.deepEqual(points, fullPoints);
    assert.deepEqual(points.map(point => point.id), ['201', '202']);
    assert.deepEqual(result.availableFuelTypes, ['LPG', 'PB95']);
    assert.ok(result.records.length < rows.length);
});

test('continues in batches through invalid history instead of inventing a five-refuel baseline', async () => {
    //Given
    const rows = Array.from({ length: 150 }, (_, index) => row(index + 1,
        new Date(Date.UTC(2025, 6, 1 + index)).toISOString(), { liters: index > 10 ? 0 : 40 }));
    rows.push(row(151, '2026-01-01'));
    const { repository, calls } = setup(rows);
    //When
    const result = await repository.read('car', filter);
    const actual = new FuelAnalyticsCalculator().calculate(result.records, filter);
    //Then
    assert.equal(calls.length, 3);
    assert.equal(actual.points[0].improvement, 0);
});

test('does not treat a partially fetched day as complete context', async () => {
    //Given
    const rows = Array.from({ length: 110 }, (_, index) => row(index + 1, '2025-12-31'));
    rows.push(row(111, '2026-01-01'));
    const { repository, calls } = setup(rows);
    //When
    const result = await repository.read('car', filter);
    //Then
    assert.equal(calls.length, 3);
    assert.equal(result.records.length, 111);
    assert.equal(new FuelAnalyticsCalculator().calculate(result.records, filter).points[0].improvement, 0);
});

test('returns null without fuel queries for a missing car', async () => {
    //Given
    const { repository, calls } = setup([], false);
    //When
    const result = await repository.read('missing', filter);
    //Then
    assert.equal(result, null);
    assert.equal(calls.length, 0);
});

test('returns an empty range without loading historical baselines', async () => {
    //Given
    const { repository, calls } = setup([row(1, '2020-01-01')]);
    //When
    const result = await repository.read('car', filter);
    //Then
    assert.deepEqual(result.records, []);
    assert.equal(calls.length, 1);
});

test('rejects oversized visible data rather than truncating it', async () => {
    //Given
    const { repository, calls } = setup(Array.from({ length: 5001 }, (_, index) => row(index + 1, '2026-01-01')));
    //When
    const run = () => repository.read('car', filter);
    //Then
    await assert.rejects(run, AnalyticsLimitError);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].take, 5001);
});

test('bounds context scans when historical records cannot provide a baseline', async () => {
    //Given
    const rows = Array.from({ length: 5100 }, (_, index) => row(index + 1, '2025-01-01', { liters: 0 }));
    rows.push(row(5101, '2026-01-01'));
    const { repository, calls } = setup(rows);
    //When
    const run = () => repository.read('car', filter);
    //Then
    await assert.rejects(run, AnalyticsLimitError);
    assert.ok(calls.length <= 51);
});
