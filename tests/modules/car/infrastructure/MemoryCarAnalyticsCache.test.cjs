const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MemoryCarAnalyticsCache } = require('../../../../src/modules/car/infrastructure/MemoryCarAnalyticsCache');
const { AnalyticsBusyError } = require('../../../../src/modules/car/domain/repository/CarAnalyticsRepository');

function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}
const limits = { ttlMs: 100, entries: 2, bytes: 1000, pending: 2 };

test('caches detached values until the TTL expires with separate car and filter keys', async () => {
    //Given
    let time = 0, calls = 0;
    const cache = new MemoryCarAnalyticsCache(() => time, limits);
    const load = async () => ({ count: ++calls });
    //When
    const first = await cache.getOrLoad('car', 'filter', load);
    first.count = 99;
    const hit = await cache.getOrLoad('car', 'filter', load);
    time = 100;
    const expired = await cache.getOrLoad('car', 'filter', load);
    await cache.getOrLoad('other', 'filter', load);
    await cache.getOrLoad('car', 'other-filter', load);
    //Then
    assert.equal(hit.count, 1);
    assert.equal(expired.count, 2);
    assert.equal(calls, 4);
});

test('shares one in-flight operation and detaches results for each caller', async () => {
    //Given
    const cache = new MemoryCarAnalyticsCache();
    const gate = deferred();
    let calls = 0;
    const load = () => { calls++; return gate.promise; };
    //When
    const first = cache.getOrLoad('car', 'key', load);
    const second = cache.getOrLoad('car', 'key', load);
    gate.resolve({ value: 1 });
    const [a, b] = await Promise.all([first, second]);
    a.value = 2;
    //Then
    assert.equal(calls, 1);
    assert.equal(b.value, 1);
});

test('invalidates every variant of one car without affecting other cars', async () => {
    //Given
    const cache = new MemoryCarAnalyticsCache();
    let calls = 0;
    const load = async () => ++calls;
    await cache.getOrLoad('car', 'a', load);
    await cache.getOrLoad('car', 'b', load);
    await cache.getOrLoad('other', 'a', load);
    //When
    cache.invalidate('car');
    const other = await cache.getOrLoad('other', 'a', load);
    await cache.getOrLoad('car', 'a', load);
    await cache.getOrLoad('car', 'b', load);
    //Then
    assert.equal(other, 3);
    assert.equal(calls, 5);
});

test('old work cannot repopulate the cache or remove a newer in-flight operation', async () => {
    //Given
    const cache = new MemoryCarAnalyticsCache();
    const old = deferred(), fresh = deferred();
    const first = cache.getOrLoad('car', 'key', () => old.promise);
    //When
    cache.invalidate('car');
    const second = cache.getOrLoad('car', 'key', () => fresh.promise);
    old.resolve('old');
    await first;
    const third = cache.getOrLoad('car', 'key', async () => { throw new Error('Must join fresh work'); });
    fresh.resolve('fresh');
    //Then
    assert.equal(await second, 'fresh');
    assert.equal(await third, 'fresh');
    assert.equal(await cache.getOrLoad('car', 'key', async () => 'wrong'), 'fresh');
});

test('does not overwrite a completed fresh value when invalidated work finishes last', async () => {
    //Given
    const cache = new MemoryCarAnalyticsCache();
    const gate = deferred();
    const old = cache.getOrLoad('car', 'key', () => gate.promise);
    //When
    cache.invalidate('car');
    await cache.getOrLoad('car', 'key', async () => 'fresh');
    gate.resolve('old');
    await old;
    //Then
    assert.equal(await cache.getOrLoad('car', 'key', async () => 'wrong'), 'fresh');
});

test('releases failed work and does not cache errors', async () => {
    //Given
    const cache = new MemoryCarAnalyticsCache();
    //When
    const failed = cache.getOrLoad('car', 'key', async () => { throw new Error('Failed'); });
    //Then
    await assert.rejects(failed, /Failed/);
    assert.equal(await cache.getOrLoad('car', 'key', async () => 'recovered'), 'recovered');
});

test('evicts least recently used entries and enforces the byte budget', async () => {
    //Given
    const cache = new MemoryCarAnalyticsCache(() => 0, { ...limits, bytes: 12 });
    let calls = 0;
    const load = async () => { calls++; return 'abcd'; }; // Six JSON bytes.
    await cache.getOrLoad('car', 'a', load);
    await cache.getOrLoad('car', 'b', load);
    await cache.getOrLoad('car', 'a', load);
    //When
    await cache.getOrLoad('car', 'c', load);
    await cache.getOrLoad('car', 'a', load);
    await cache.getOrLoad('car', 'b', load);
    //Then
    assert.equal(calls, 4);
});

test('does not retain oversized responses', async () => {
    //Given
    const cache = new MemoryCarAnalyticsCache(() => 0, { ...limits, bytes: 3 });
    let calls = 0;
    const load = async () => { calls++; return 'large'; };
    //When
    await cache.getOrLoad('car', 'key', load);
    await cache.getOrLoad('car', 'key', load);
    //Then
    assert.equal(calls, 2);
});

test('bounds active work even after invalidation and frees capacity on completion', async () => {
    //Given
    const cache = new MemoryCarAnalyticsCache(() => 0, { ...limits, pending: 1 });
    const gate = deferred();
    const pending = cache.getOrLoad('car', 'key', () => gate.promise);
    //When
    cache.invalidate('car');
    const busy = cache.getOrLoad('car', 'key', async () => 'new');
    //Then
    await assert.rejects(busy, AnalyticsBusyError);
    gate.resolve('old');
    await pending;
    assert.equal(await cache.getOrLoad('car', 'key', async () => 'new'), 'new');
});
