const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HealthUseCases } = require('../../../../src/modules/health/application/HealthUseCases');

function setup() {
    const writes = [];
    const repository = {
        async getState() { return { goalKg: null, pathId: 'frodo', weights: [], distances: [] }; },
        async setGoal(value) { writes.push(['goal', value]); },
        async setPath(value) { writes.push(['path', value]); },
        async saveWeight(id, value, replace) { writes.push(['weight', id, value, replace]); return true; },
        async deleteWeight(id) { writes.push(['deleteWeight', id]); return true; },
        async createDistance(value) { writes.push(['distance', value]); },
        async updateDistance(id, value) { writes.push(['updateDistance', id, value]); return true; },
        async deleteDistance(id) { writes.push(['deleteDistance', id]); return true; },
    };
    return { service: new HealthUseCases(repository), writes };
}

test('accepts valid weight replacement and multiple distances on one day', async () => {
    const { service, writes } = setup();
    await service.saveWeight(null, { date: '2026-10-26', kg: 104.5, note: '  rano  ', replaceExisting: true });
    await service.createDistance({ date: '2026-10-26', km: 3.2 });
    await service.createDistance({ date: '2026-10-26', km: 4.1 });
    assert.deepEqual(writes[0], ['weight', null, { date: '2026-10-26', kg: 104.5, note: 'rano' }, true]);
    assert.equal(writes.filter(([kind]) => kind === 'distance').length, 2);
});

test('rejects invalid measurements before writing', async () => {
    const { service, writes } = setup();
    for (const input of [
        { date: '2026-02-30', kg: 105 }, { date: '2026-10-26', kg: -1 },
        { date: '2026-10-26', kg: 100.123 }, { date: '2026-10-26', kg: '100' },
        { date: '2026-10-26', kg: 100, note: 'x'.repeat(301) },
    ]) await assert.rejects(() => service.saveWeight(null, input), { code: 'INVALID' });
    await assert.rejects(() => service.setGoal({ kg: 0 }), { code: 'INVALID' });
    await assert.rejects(() => service.setPath({ pathId: 'unknown' }), { code: 'INVALID' });
    assert.equal(writes.length, 0);
});

test('missing record is reported instead of silently succeeding', async () => {
    const service = new HealthUseCases({
        async saveWeight() { return false; }, async deleteWeight() { return false; }, async updateDistance() { return false; },
    });
    await assert.rejects(() => service.saveWeight('missing', { date: '2026-10-26', kg: 100 }), { code: 'NOT_FOUND' });
    await assert.rejects(() => service.deleteWeight('missing'), { code: 'NOT_FOUND' });
    await assert.rejects(() => service.updateDistance('missing', { date: '2026-10-26', km: 5 }), { code: 'NOT_FOUND' });
});
