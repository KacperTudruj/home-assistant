const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CarController } = require('../../../../src/modules/car/interface/CarController');
const { CarRepositoryPrisma } = require('../../../../src/modules/car/infrastructure/CarRepositoryPrisma');

for (const statistics of [null, { totalCost: 800, totalLiters: 100, avgPricePerLiter: 8, avgLitersPerRefuel: 50, avgConsumption: 6, yearlyStats: [] }]) {
    test(`keeps fuel statistics without the legacy oil response (${statistics ? 'records' : 'empty'})`, async t => {
        //Given
        t.mock.method(CarRepositoryPrisma.prototype, 'findById', async () => ({ getStatistics: () => statistics }));
        const controller = new CarController();
        let result;
        const response = { json(value) { result = value; } };
        //When
        await controller.getStats({ params: { id: 'car-1' } }, response);
        //Then
        assert.equal(result.totalCost, statistics?.totalCost ?? 0);
        assert.equal(result.totalLiters, statistics?.totalLiters ?? 0);
        assert.equal(Object.hasOwn(result, 'oilChange'), false);
        assert.deepEqual(result.yearlyStats, []);
    });
}
