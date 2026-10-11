const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GenerateFuelChartsUseCase } = require('../../../../src/modules/car/application/GenerateFuelChartsUseCase');
const { LocalChartGenerator } = require('../../../../src/modules/charts/application/LocalChartGenerator');

const filter = { from: '2026-01-01', to: '2026-12-31', fuelType: 'PB95' };

test('prepares four charts with units, separate fuel price series and one generator call', async () => {
    //Given
    const records = ['PB95', 'LPG'].map((fuelType, index) => ({
        id: String(index), date: '2026-01-01', fuelType, liters: 40, totalPrice: 240,
        mileageAtRefuelKm: 1000 + index * 500, tripDistance: 500,
    }));
    let calls = 0;
    const generator = { generate: async input => {
        calls++;
        return new LocalChartGenerator().generate(input);
    } };
    //When
    const { document, analytics } = await new GenerateFuelChartsUseCase(generator).execute(records, filter);
    //Then
    assert.equal(calls, 1);
    assert.equal(document.version, 1);
    assert.deepEqual(document.charts.map(chart => chart.yAxis.unit), ['l/100 km', 'l/100 km', 'zł/100 km', 'zł/l']);
    assert.equal(document.charts[1].referenceLines[0].value, 0);
    assert.deepEqual(document.charts[3].series.map(series => series.id), ['LPG', 'PB95']);
    assert.equal(document.charts[0].series[0].points[0].y, 8);
    assert.equal(analytics.points.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(document)), document);
});

test('prepares empty charts for an empty car', async () => {
    //Given
    const useCase = new GenerateFuelChartsUseCase(new LocalChartGenerator());
    //When
    const { document } = await useCase.execute([], filter);
    //Then
    assert.equal(document.charts.length, 4);
    assert.ok(document.charts.every(chart => chart.series.every(series => series.points.length === 0)));
});

test('propagates generator failures instead of reporting empty analytics', async () => {
    //Given
    const failure = new Error('Generator unavailable');
    const useCase = new GenerateFuelChartsUseCase({ generate: async () => { throw failure; } });
    //When
    const execute = () => useCase.execute([], filter);
    //Then
    await assert.rejects(execute, error => error === failure);
});
