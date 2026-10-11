const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CarAnalyticsController } = require('../../../../src/modules/car/interface/CarAnalyticsController');
const { AnalyticsNotFoundError, AnalyticsLimitError, AnalyticsBusyError } = require('../../../../src/modules/car/domain/repository/CarAnalyticsRepository');
const { InvalidFuelAnalyticsInputError } = require('../../../../src/modules/car/domain/FuelAnalyticsCalculator');

function response() {
    return { code: 200, headers: {}, body: null, setHeader(key, value) { this.headers[key] = value; },
        status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('delegates HTTP filters and disables browser caching', async () => {
    //Given
    let received;
    const controller = new CarAnalyticsController({ execute: async (...args) => { received = args; return { result: 'ok' }; } });
    const res = response();
    //When
    await controller.get({ params: { id: 'car' }, query: { fuelType: 'LPG' } }, res);
    //Then
    assert.deepEqual(received, ['car', { fuelType: 'LPG' }]);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.deepEqual(res.body, { result: 'ok' });
});

for (const [ErrorType, status] of [[AnalyticsNotFoundError, 404], [AnalyticsLimitError, 400],
    [InvalidFuelAnalyticsInputError, 400], [AnalyticsBusyError, 503], [Error, 500]]) {
    test(`maps ${ErrorType.name} to HTTP ${status}`, async t => {
        //Given
        t.mock.method(console, 'error', () => {});
        const controller = new CarAnalyticsController({ execute: async () => { throw new ErrorType('failure'); } });
        const res = response();
        //When
        await controller.get({ params: { id: 'car' }, query: {} }, res);
        //Then
        assert.equal(res.code, status);
        assert.equal(res.headers['Cache-Control'], 'no-store');
        if (status === 503) assert.equal(res.headers['Retry-After'], '1');
        if (status === 500) assert.notEqual(res.body.error, 'failure');
    });
}
