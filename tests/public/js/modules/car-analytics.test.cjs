const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../../../../public/js/modules/car-analytics.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');

function harness(search = '?carId=test') {
    const nodes = new Map(), requests = [], draws = [];
    const get = id => {
        if (!nodes.has(id)) nodes.set(id, { value: id === 'analytics-period' ? '12' : id === 'analytics-fuel' ? 'PB95' : '',
            textContent: '', hidden: false, handlers: {}, addEventListener(event, fn) { this.handlers[event] = fn; },
            setAttribute() {}, reportValidity() { return true; } });
        return nodes.get(id);
    };
    const context = vm.createContext({ URLSearchParams, AbortController, location: { search },
        document: { getElementById: get }, window: { addEventListener() {} },
        renderCharts(root, spec) { draws.push(spec); return () => {}; },
        fetch(url, options) { return new Promise(resolve => requests.push({ url, options, resolve })); },
    });
    vm.runInContext(source, context);
    const payload = name => ({ car: { name }, generatedAt: '2026-10-11T10:00:00Z', document: { version: 1, charts: [] },
        analytics: { filter: { from: '2026-01-01', to: '2026-10-11', fuelType: 'PB95' },
            skipped: { consumption: 0, costPer100Km: 0, improvement: 0, pricePerLiter: 0 }, warnings: [], pricePoints: [] } });
    return { context, get, requests, draws, payload };
}

test('loads all history once without filter parameters', async () => {
    //Given
    const h = harness();
    //When
    const loading = h.context.initCarAnalytics();
    h.requests[0].resolve({ ok: true, json: async () => h.payload('Car') });
    await loading;
    //Then
    assert.equal(h.requests.length, 1);
    assert.equal(h.draws.length, 1);
    assert.equal(h.requests[0].url, '/api/cars/test/analytics');

});

test('aborts previous requests and ignores stale successes', async () => {
    //Given
    const h = harness();
    const first = h.context.initCarAnalytics();
    //When
    h.get('analytics-retry').handlers.click();
    h.requests[1].resolve({ ok: true, json: async () => h.payload('New') });
    await new Promise(resolve => setImmediate(resolve));
    h.requests[0].resolve({ ok: true, json: async () => h.payload('Old') });
    await first;
    //Then
    assert.equal(h.requests[0].options.signal.aborted, true);
    assert.equal(h.get('analytics-car').textContent, 'New');
    assert.equal(h.draws.length, 1);
});

test('shows API errors and retries the failed query', async () => {
    //Given
    const h = harness();
    //When
    const loading = h.context.initCarAnalytics();
    h.requests[0].resolve({ ok: false, json: async () => ({ error: 'Too many points' }) });
    await loading;
    //Then
    assert.equal(h.get('analytics-status').textContent, 'Too many points');
    assert.equal(h.get('analytics-retry').hidden, false);
    //When
    h.get('analytics-retry').handlers.click();
    //Then
    assert.equal(h.requests[0].url, h.requests[1].url);
});

test('does not fetch without a car', async () => {
    //Given
    const h = harness('');
    //When
    await h.context.initCarAnalytics();
    //Then
    assert.equal(h.requests.length, 0);
});
