const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HealthController } = require('../../../../src/modules/health/interface/HealthController');
const { HealthError } = require('../../../../src/modules/health/domain/HealthRepository');

function response() {
    return {
        statusCode: 200, body: undefined,
        status(value) { this.statusCode = value; return this; },
        json(value) { this.body = value; return this; },
        send() { return this; },
    };
}

test('overview returns current state', async () => {
    const state = { goalKg: null, pathId: 'frodo', weights: [], distances: [] };
    const controller = new HealthController({ async getState() { return state; } });
    const res = response();
    await controller.overview({}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, state);
});

for (const [code, expected] of [['INVALID', 400], ['NOT_FOUND', 404], ['CONFLICT', 409]]) {
    test(`${code} maps to HTTP ${expected}`, async () => {
        const controller = new HealthController({ async saveWeight() { throw new HealthError(code, 'Problem'); } });
        const res = response();
        await controller.createWeight({ body: {} }, res);
        assert.equal(res.statusCode, expected);
        assert.deepEqual(res.body, { error: 'Problem' });
    });
}
