const { test } = require('node:test');
const assert = require('node:assert/strict');
const { LocalChartGenerator } = require('../../../../src/modules/charts/application/LocalChartGenerator');
const { InvalidChartError } = require('../../../../src/modules/charts/domain/ChartGenerator');

const request = () => ({ version: 1, charts: [{
    id: 'temperature', type: 'line', title: 'Room temperature', description: '',
    xAxis: { type: 'date', label: 'Day' }, yAxis: { label: 'Temperature', unit: '°C' },
    series: [{ id: 'room', label: 'Room', points: [
        { id: 'first', x: '2026-01-01', y: 21.5, details: [] },
        { id: 'second', x: '2026-01-02', y: null, details: [] },
    ] }], referenceLines: [{ value: 20, label: 'Target' }],
}] });

test('generates a detached JSON document for a non-car module with explicit gaps', async () => {
    //Given
    const input = request();
    //When
    const output = await new LocalChartGenerator().generate(input);
    //Then
    assert.deepEqual(output, input);
    assert.deepEqual(JSON.parse(JSON.stringify(output)), output);
    output.charts[0].series[0].points[0].y = 99;
    assert.equal(input.charts[0].series[0].points[0].y, 21.5);
});

for (const [name, mutate] of [
    ['unsupported version', input => input.version = 2],
    ['unsupported chart', input => input.charts[0].type = 'pie'],
    ['library options', input => input.charts[0].options = {}],
    ['callback', input => input.charts[0].title = () => 'title'],
    ['infinite value', input => input.charts[0].series[0].points[0].y = Infinity],
    ['NaN value', input => input.charts[0].series[0].points[0].y = NaN],
    ['undefined gap', input => input.charts[0].series[0].points[0].y = undefined],
    ['invalid calendar date', input => input.charts[0].series[0].points[0].x = '2026-02-30'],
    ['unordered points', input => input.charts[0].series[0].points.reverse()],
    ['duplicate points', input => input.charts[0].series[0].points[1].id = 'first'],
    ['duplicate charts', input => input.charts.push(structuredClone(input.charts[0]))],
    ['excessive charts', input => input.charts = Array(9).fill(input.charts[0])],
    ['excessive series', input => input.charts[0].series = Array(9).fill(input.charts[0].series[0])],
    ['excessive points', input => input.charts[0].series[0].points = Array(1001).fill(input.charts[0].series[0].points[0])],
    ['excessive text', input => input.charts[0].title = 'x'.repeat(501)],
    ['class instance', input => input.charts[0].xAxis = new Date()],
    ['sparse array', input => input.charts = Array(1)],
    ['accessor', input => Object.defineProperty(input.charts[0], 'title', { get: () => 'Title' })],
    ['invalid details', input => input.charts[0].series[0].points[0].details = [{ label: 'Value', value: NaN, unit: 'km' }]],
]) {
    test(`rejects ${name} at the generator boundary`, async () => {
        //Given
        const input = request();
        mutate(input);
        //When
        const generate = () => new LocalChartGenerator().generate(input);
        //Then
        await assert.rejects(generate, InvalidChartError);
    });
}

test('accepts the point limit including leap day', async () => {
    //Given
    const input = request();
    input.charts[0].series[0].points = Array.from({ length: 1000 }, (_, id) => ({
        id: String(id), x: '2024-02-29', y: id, details: [],
    }));
    //When
    const output = await new LocalChartGenerator().generate(input);
    //Then
    assert.equal(output.charts[0].series[0].points.length, 1000);
});
