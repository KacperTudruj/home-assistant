const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modules = ['health-paths.js', 'health-calculations.js', 'health-repository.js'];
const source = modules.map(name => fs.readFileSync(path.resolve(__dirname, '../../../../public/js/modules', name), 'utf8')
    .replace(/^export /gm, '')).join('\n');
const context = vm.createContext({ Date, Math, Number, String, JSON });
vm.runInContext(source, context);
const { weightProgress, journeyProgress, filterWeights, paths, HealthRepository } = vm.runInContext(
    '({ weightProgress, journeyProgress, filterWeights, paths, HealthRepository })', context);

test('weight progress handles empty history, no goal, fluctuations and a reached goal', () => {
    const entries = [
        { id: 'a', date: '2026-07-01', kg: 112 },
        { id: 'b', date: '2026-07-10', kg: 110 },
        { id: 'c', date: '2026-07-20', kg: 111 },
    ];
    assert.equal(weightProgress([], null).percent, 0);
    assert.equal(weightProgress(entries, null).change, -1);
    assert.equal(weightProgress(entries, null).remaining, null);
    assert.equal(weightProgress(entries, 100).remaining, 11);
    const reached = weightProgress([...entries, { id: 'd', date: '2026-08-01', kg: 99 }], 100);
    assert.equal(reached.remaining, 0);
    assert.equal(reached.percent, 100);
    assert.equal(reached.reached, true);
    assert.equal(filterWeights(entries, 'month', new Date(2026, 6, 25)).length, 3);
});

test('journey includes same-day distances and clamps completed route', () => {
    const middle = journeyProgress([{ km: 130 }, { km: 15 }], paths[0]);
    assert.equal(middle.total, 145);
    assert.equal(middle.current.name, 'Rivendell');
    assert.equal(middle.next.name, 'Moria');
    assert.equal(middle.toNext, 60);
    assert.equal(journeyProgress([{ km: 500 }], paths[0]).percent, 100);
});

test('API repository sends weight replacement explicitly and creates independent distance entries', async () => {
    const calls = [];
    context.fetch = async (url, options) => {
        calls.push({ url, options });
        return { ok: true, status: 204 };
    };
    const repository = new HealthRepository();
    await repository.saveWeight({ date: '2026-10-26', kg: 105, note: '' }, true);
    await repository.saveDistance({ date: '2026-10-26', km: 3, note: '' });
    await repository.saveDistance({ date: '2026-10-26', km: 5, note: '' });
    await repository.deleteWeight('weight-id');
    assert.equal(calls[0].url, '/api/health/weights');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(JSON.parse(calls[0].options.body).replaceExisting, true);
    assert.equal(calls[1].url, '/api/health/distances');
    assert.equal(calls[2].url, '/api/health/distances');
    assert.equal(calls[3].url, '/api/health/weights/weight-id');
    assert.equal(calls[3].options.method, 'DELETE');
});
