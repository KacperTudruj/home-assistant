const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../../../../public/js/modules/chart-renderer.js'), 'utf8').replace(/^export /gm, '');

test('uses actual date spacing, preserves gaps and adds a reference series', () => {
    //Given
    const context = vm.createContext({});
    vm.runInContext(source, context);
    const spec = { xAxis: { label: 'Date' }, yAxis: { unit: '°C' }, referenceLines: [{ value: 0, label: 'Zero' }],
        series: [{ label: 'Room', points: [{ x: '2026-01-01', y: 2, details: [] }, { x: '2026-01-11', y: null, details: [] }] }] };
    //When
    const config = context.chartConfig(spec);
    //Then
    assert.equal(config.data.datasets[0].data[1].y, null);
    assert.equal(config.data.datasets[0].spanGaps, false);
    assert.equal(config.data.datasets[0].data[1].x - config.data.datasets[0].data[0].x, 10 * 86400000);
    assert.equal(config.data.datasets[1].data[0].y, 0);
});

test('draws a horizontal reference line around a single real measurement', () => {
    const context = vm.createContext({});
    vm.runInContext(source, context);
    const spec = { xAxis: { label: 'Data' }, yAxis: { unit: 'kg' }, referenceLines: [{ value: 100, label: 'Cel' }],
        series: [{ label: 'Waga', points: [{ x: '2026-10-26', y: 105, details: [] }] }] };
    const config = context.chartConfig(spec);
    assert.equal(config.data.datasets[0].data.length, 1);
    assert.equal(config.data.datasets[1].data[1].x - config.data.datasets[1].data[0].x, 2 * 86400000);
});
