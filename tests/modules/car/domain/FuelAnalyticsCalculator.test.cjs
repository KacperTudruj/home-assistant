const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FuelAnalyticsCalculator, InvalidFuelAnalyticsInputError } = require('../../../../src/modules/car/domain/FuelAnalyticsCalculator');

const filter = { from: '2026-01-01', to: '2026-12-31', fuelType: 'PB95' };
const fuel = (id, overrides = {}) => ({
    id: String(id), date: `2026-01-${String(id).padStart(2, '0')}`, fuelType: 'PB95',
    liters: 40, totalPrice: 240, mileageAtRefuelKm: 1000 + Number(id) * 500,
    tripDistance: null, ...overrides,
});
const calculate = (records, options = filter) => new FuelAnalyticsCalculator().calculate(records, options);

test('calculates consumption, cost and price without intermediate rounding', () => {
    //Given
    const records = [fuel(1), fuel(2, { tripDistance: 333 })];
    //When
    const { points } = calculate(records);
    //Then
    assert.equal(points[1].consumption, 40 / 333 * 100);
    assert.equal(points[1].costPer100Km, 240 / 333 * 100);
    assert.equal(points[1].pricePerLiter, 6);
    assert.equal(points[1].distanceKm, 333);
    assert.equal(points[0].consumption, null);
    assert.equal(points[0].pricePerLiter, 6);
});

test('uses exactly five previous valid refuels weighted by distance, excluding the current refuel', () => {
    //Given
    const records = [fuel(1, { liters: 1000, tripDistance: 100 })];
    for (let id = 2; id <= 6; id++) records.push(fuel(id, { liters: id * 10, tripDistance: id * 100 }));
    records.push(fuel(7, { liters: 5, tripDistance: 100 }));
    //When
    const { points } = calculate(records);
    //Then
    assert.equal(points[4].improvement, null);
    assert.equal(points[6].improvement, 5);
    assert.equal(points[5].improvement, (1000 + 20 + 30 + 40 + 50) / (100 + 200 + 300 + 400 + 500) * 100 - 10);
});

test('preserves predecessor and baseline when restricting the visible date range', () => {
    //Given
    const records = Array.from({ length: 7 }, (_, index) => fuel(index + 1));
    //When
    const all = calculate(records);
    const restricted = calculate(records, { ...filter, from: '2026-01-07', to: '2026-01-07' });
    //Then
    assert.deepEqual(restricted.points, [all.points[6]]);
    assert.equal(restricted.points[0].improvement, 0);
});

for (const [name, overrides, reason] of [
    ['zero odometer', { mileageAtRefuelKm: 0 }, 'MISSING_DISTANCE'],
    ['missing odometer', { mileageAtRefuelKm: null }, 'MISSING_DISTANCE'],
    ['reversed odometer', { mileageAtRefuelKm: 1400 }, 'INVALID_DISTANCE'],
    ['unchanged odometer', { mileageAtRefuelKm: 1500 }, 'INVALID_DISTANCE'],
    ['upper distance boundary', { tripDistance: 10000 }, 'INVALID_DISTANCE'],
    ['excessive explicit distance', { tripDistance: 10001 }, 'INVALID_DISTANCE'],
]) {
    test(`reports ${name} without losing the fuel price`, () => {
        //Given
        const records = [fuel(1), fuel(2, overrides)];
        //When
        const point = calculate(records).points[1];
        //Then
        assert.equal(point.consumption, null);
        assert.equal(point.distanceKm, null);
        assert.equal(point.pricePerLiter, 6);
        assert.ok(point.issues.some(issue => issue.metric === 'consumption' && issue.reason === reason));
    });
}

for (const tripDistance of [null, 0, -1, NaN, Infinity]) {
    test(`falls back to odometer distance for invalid trip value ${tripDistance}`, () => {
        //Given
        const records = [fuel(1), fuel(2, { tripDistance })];
        //When
        const point = calculate(records).points[1];
        //Then
        assert.equal(point.distanceKm, 500);
        assert.equal(point.consumption, 8);
    });
}

test('accepts explicit distance on the first refuel and below the upper boundary', () => {
    //Given
    const records = [fuel(1, { tripDistance: 9999 })];
    //When
    const point = calculate(records).points[0];
    //Then
    assert.equal(point.distanceKm, 9999);
});

test('does not calculate an odometer interval starting at a missing zero reading', () => {
    //Given
    const records = [fuel(1, { mileageAtRefuelKm: 0 }), fuel(2)];
    //When
    const point = calculate(records).points[1];
    //Then
    assert.equal(point.consumption, null);
});

test('keeps independently valid metrics when liters or price are invalid', () => {
    //Given
    const records = [fuel(1), fuel(2, { liters: NaN }), fuel(3, { totalPrice: -1 })];
    //When
    const { points, skipped } = calculate(records);
    //Then
    assert.equal(points[1].consumption, null);
    assert.equal(points[1].costPer100Km, 48);
    assert.equal(points[2].consumption, 8);
    assert.equal(points[2].costPer100Km, null);
    assert.equal(points[2].pricePerLiter, null);
    assert.equal(skipped.pricePerLiter, 2);
    assert.deepEqual(JSON.parse(JSON.stringify(points)), points);
});

test('skips invalid consumption in the comparison history', () => {
    //Given
    const records = Array.from({ length: 7 }, (_, index) => fuel(index + 1, { tripDistance: 500 }));
    records[3].liters = -1;
    //When
    const { points } = calculate(records);
    //Then
    assert.equal(points[5].improvement, null);
    assert.equal(points[6].improvement, 0);
});

test('sorts unambiguous same-day records by mileage without mutating input', () => {
    //Given
    const records = [fuel(2, { date: '2026-01-01' }), fuel(1)];
    const snapshot = structuredClone(records);
    //When
    const { points } = calculate(records);
    //Then
    assert.deepEqual(points.map(point => point.id), ['1', '2']);
    assert.equal(points[1].distanceKm, 500);
    assert.deepEqual(records, snapshot);
});

test('does not infer intervals or baseline order from IDs on ambiguous days', () => {
    //Given
    const records = [fuel(2, { date: '2026-01-01', mileageAtRefuelKm: 1500, tripDistance: 100 }), fuel(1), fuel(3)];
    //When
    const result = calculate(records);
    const reversed = calculate([...records].reverse());
    //Then
    assert.deepEqual(result, reversed);
    assert.ok(result.points.every(point => point.consumption === null));
    assert.ok(result.points.every(point => point.pricePerLiter === 6));
});

test('does not bridge other fuels when filtering and retains separate price data', () => {
    //Given
    const records = [fuel(1), fuel(2, { fuelType: 'LPG' }), fuel(3, { tripDistance: 500 }), fuel(4)];
    //When
    const result = calculate(records);
    //Then
    assert.deepEqual(result.points.map(point => point.id), ['1', '3', '4']);
    assert.equal(result.points[1].consumption, null);
    assert.equal(result.points[2].consumption, 8);
    assert.equal(result.pricePoints.length, 4);
    assert.ok(result.warnings.includes('MULTIPLE_FUELS'));
});

test('never presents electricity as liters', () => {
    //Given
    const records = [fuel(1, { fuelType: 'ELECTRIC', tripDistance: 100 })];
    //When
    const result = calculate(records, { ...filter, fuelType: 'ELECTRIC' });
    //Then
    assert.equal(result.points[0].pricePerLiter, null);
    assert.equal(result.points[0].consumption, null);
    assert.ok(result.warnings.includes('ELECTRIC_NOT_SUPPORTED'));
});

test('returns empty data instead of invented zero averages', () => {
    //Given
    const records = [];
    //When
    const result = calculate(records);
    //Then
    assert.deepEqual(result.points, []);
    assert.deepEqual(result.skipped, { consumption: 0, costPer100Km: 0, improvement: 0, pricePerLiter: 0 });
});

test('rejects invalid dates, duplicate IDs, reversed ranges and excessive input', () => {
    //Given
    const scenarios = [
        () => calculate([fuel(1, { date: '2026-02-30' })]),
        () => calculate([fuel(1), fuel(1)]),
        () => calculate([], { ...filter, from: '2027-01-01' }),
        () => calculate([], { ...filter, to: '2026-02-30' }),
        () => calculate([], { ...filter, fuelType: 'UNKNOWN' }),
        () => calculate(Array.from({ length: 5001 }, () => fuel(1))),
    ];
    //When
    for (const action of scenarios) {
        //Then
        assert.throws(action, InvalidFuelAnalyticsInputError);
    }
});

test('converts overflowing metrics to explained gaps', () => {
    //Given
    const records = [fuel(1, { tripDistance: Number.MIN_VALUE })];
    //When
    const point = calculate(records).points[0];
    //Then
    assert.equal(point.consumption, null);
    assert.ok(point.issues.some(issue => issue.reason === 'NON_FINITE_RESULT'));
    assert.deepEqual(JSON.parse(JSON.stringify(point)), point);
});

test('keeps comparison histories separate for different fuels', () => {
    //Given
    const records = Array.from({ length: 6 }, (_, index) => fuel(index + 1, { tripDistance: 500 }));
    records.push(fuel(7, { fuelType: 'LPG', tripDistance: 100 }));
    records.push(fuel(8, { fuelType: 'LPG', tripDistance: 100 }));
    //When
    const result = calculate(records, { ...filter, fuelType: 'LPG' });
    //Then
    assert.equal(result.points[1].consumption, 40);
    assert.equal(result.points[1].improvement, null);
    assert.ok(result.points[1].issues.some(issue => issue.reason === 'INSUFFICIENT_HISTORY'));
});

test('ignores future records when resolving same-day ambiguity and visible fuel types', () => {
    //Given
    const records = [fuel(1, { tripDistance: 500 }), fuel(2, { fuelType: 'LPG' })];
    //When
    const result = calculate(records, { ...filter, to: '2026-01-01' });
    //Then
    assert.deepEqual(result.availableFuelTypes, ['PB95']);
    assert.equal(result.points.length, 1);
    assert.equal(result.points[0].consumption, 8);
});
