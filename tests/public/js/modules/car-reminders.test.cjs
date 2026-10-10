const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../../../../public/js/modules/car-reminders.js'), 'utf8').replace(/^export /gm, '');

for (const [reminder, expected] of [
    [{ status: 'UPCOMING', remaining: { value: 4000, unit: 'KM' } }, /Za 4\s?000 km/],
    [{ status: 'OVERDUE', remaining: { value: -2, unit: 'DAYS' } }, /Przekroczono o 2 dni/],
    [{ status: 'DUE', remaining: { value: 0, unit: 'DAYS' } }, /Dzisiaj/],
    [{ status: 'DUE', remaining: { value: 0, unit: 'KM' } }, /Osiągnięty przebieg/],
    [{ status: 'UNKNOWN', remaining: null }, /Brak danych/],
    [{ status: 'COMPLETED', remaining: null }, /Wykonane/],
    [{ status: 'ARCHIVED', remaining: null }, /Archiwalne/]
]) {
    test(`formats ${reminder.status} ${reminder.remaining?.unit ?? ''} without an oil-specific rule`, () => {
        //Given
        const context = vm.createContext({});
        vm.runInContext(source, context);
        //When
        const result = context.formatRemaining(reminder);
        //Then
        assert.match(result, expected);
    });
}

test('ignores stale responses after switching cars', async () => {
    //Given
    const nodes = new Map();
    const node = () => ({ value: '', textContent: '', children: [], close() {}, replaceChildren() { this.children = []; }, appendChild(child) { this.children.push(child); }, addEventListener() {} });
    const pending = [];
    const context = vm.createContext({ URLSearchParams, document: {
        getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
        createElement: node
    }, fetch(url) { return new Promise(resolve => pending.push({ url, resolve })); } });
    vm.runInContext(source, context);
    //When
    const first = context.loadCarReminders({ id: 'first', isActive: true });
    const second = context.loadCarReminders({ id: 'second', isActive: false });
    pending[1].resolve({ ok: true, async json() { return []; } });
    await second;
    pending[0].resolve({ ok: true, async json() { throw new Error('Old request failed'); } });
    await first;
    //Then
    assert.equal(nodes.get('reminder-error').textContent, '');
    assert.equal(nodes.get('add-reminder-btn').disabled, true);
    assert.equal(nodes.get('reminder-list').children.length, 1);
    assert.match(pending[1].url, /resourceId=second/);
});
