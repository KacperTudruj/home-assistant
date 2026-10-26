const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modules = ['health-mocks.js', 'health-calculations.js', 'health-repository.js'];
const source = modules.map(name => fs.readFileSync(path.resolve(__dirname, '../../../../public/js/modules', name), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '')).join('\n');
const context = vm.createContext({ Date, Math, Number, String, JSON });
vm.runInContext(source, context);
const { weightProgress, journeyProgress, filterWeights, paths, HealthRepository } = vm.runInContext(
    '({ weightProgress, journeyProgress, filterWeights, paths, HealthRepository })', context);

test('weight progress uses actual measurements and clamps reached goals', () => {
    const entries = [
        { id: 'a', date: '2026-07-01', kg: 112 },
        { id: 'b', date: '2026-07-10', kg: 110 },
        { id: 'c', date: '2026-07-20', kg: 111 },
    ];
    assert.equal(weightProgress(entries, 100).latest.kg, 111);
    assert.equal(weightProgress(entries, 100).remaining, 11);
    assert.equal(weightProgress([], 100).percent, 0);
    const reached = weightProgress([...entries, { id: 'd', date: '2026-08-01', kg: 99 }], 100);
    assert.equal(reached.remaining, 0);
    assert.equal(reached.percent, 100);
    assert.equal(reached.reached, true);
    assert.equal(filterWeights(entries, 'month', new Date(2026, 6, 25)).length, 3);
});

test('journey totals use all distance entries and respect route endpoints', () => {
    const path = paths[0];
    const middle = journeyProgress([{ km: 130 }, { km: 15 }], path);
    assert.equal(middle.total, 145);
    assert.equal(middle.current.name, 'Rivendell');
    assert.equal(middle.next.name, 'Moria');
    assert.equal(middle.toNext, 60);
    const finished = journeyProgress([{ km: 500 }], path);
    assert.equal(finished.percent, 100);
    assert.equal(finished.next, null);
});

test('repository persists edits, replaces duplicate-day weights and keeps same-day distances', () => {
    const values = new Map();
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    const repo = new HealthRepository(storage);
    const day = '2026-10-26';
    repo.saveWeight({ id: 'first', date: day, kg: 105, note: '' });
    repo.saveWeight({ id: 'replacement', date: day, kg: 104, note: '' });
    repo.saveDistance({ id: 'walk', date: day, km: 3, note: '' });
    repo.saveDistance({ id: 'run', date: day, km: 5, note: '' });
    repo.saveDistance({ id: 'walk', date: day, km: 4, note: '' });
    const restored = new HealthRepository(storage).getState();
    assert.equal(restored.weights.filter(item => item.date === day).length, 1);
    assert.equal(restored.weights.find(item => item.date === day).kg, 104);
    assert.equal(restored.distances.filter(item => item.date === day).length, 2);
    assert.equal(restored.distances.find(item => item.id === 'walk').km, 4);
    repo.deleteDistance('run');
    assert.equal(repo.getState().distances.filter(item => item.date === day).length, 1);
    repo.deleteWeight('replacement');
    assert.equal(repo.getState().weights.filter(item => item.date === day).length, 0);
});
