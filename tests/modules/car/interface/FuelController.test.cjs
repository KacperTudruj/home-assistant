const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FuelController } = require('../../../../src/modules/car/interface/FuelController');

for (const scenario of ['success', 'write failure', 'response failure', 'invalid input']) {
    test(`invalidates analytics only after persistence: ${scenario}`, async t => {
        //Given
        t.mock.method(console, 'error', () => {});
        const events = [];
        const database = { car: { findUnique: async () => ({ id: 'car' }) }, fuelRecord: {
            create: async ({ data }) => {
                if (scenario === 'write failure') throw new Error('Write failed');
                events.push('stored'); return { ...data, id: 'fuel' };
            },
            findFirst: async () => { if (scenario === 'response failure') throw new Error('Read failed'); return null; },
        } };
        const controller = new FuelController({}, { invalidate: id => events.push(`invalidated:${id}`) }, database);
        const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json() {} };
        const body = scenario === 'invalid input' ? {} : {
            date: '2020-01-01', liters: 40, meter: 1000, totalPrice: 240, fuelPricePerLiter: 6,
        };
        //When
        await controller.create({ params: { id: 'car' }, body }, res);
        //Then
        assert.deepEqual(events, ['success', 'response failure'].includes(scenario) ? ['stored', 'invalidated:car'] : []);
        assert.equal(res.statusCode, scenario === 'success' ? 201 : scenario === 'invalid input' ? 400 : 500);
    });
}
