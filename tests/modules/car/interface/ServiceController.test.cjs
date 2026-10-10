const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ServiceController } = require('../../../../src/modules/car/interface/ServiceController');
const { CreateServiceRecordUseCase } = require('../../../../src/modules/car/application/CreateServiceRecordUseCase');
const { ListServiceRecordsUseCase } = require('../../../../src/modules/car/application/ListServiceRecordsUseCase');
const { Car } = require('../../../../src/modules/car/domain/entity/Car');

function setup(car) {
    const records = [];
    const repository = {
        async create(carId, record) {
            records.push({ id: String(records.length + 1), carId, ...record });
            car.addServiceRecord(record);
        },
        async findByCarId(carId) {
            return records.filter(record => record.carId === carId)
                .sort((a, b) => b.date - a.date);
        }
    };
    const controller = new ServiceController(
        new CreateServiceRecordUseCase({ async findById() { return car; } }, repository),
        new ListServiceRecordsUseCase(repository)
    );
    return { controller, records };
}

function response() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = JSON.parse(JSON.stringify(body)); return this; },
        send() { return this; }
    };
}

const input = {
    description: 'Oil, bushings and ball joint', cost: 800, mileageKm: 180000,
    date: '2026-10-10', isOilChange: true
};

test('creation preserves 204, list fields and the oil change baseline', async () => {
    const car = new Car({ id: 'car-1', name: 'Car', year: 2020, isActive: true, oilChangeIntervalKm: 10000 });
    const { controller } = setup(car);
    const created = response();
    await controller.create({ params: { id: car.id }, body: input }, created);
    assert.equal(created.statusCode, 204);
    assert.equal(created.body, undefined);
    assert.equal(car.getRemainingKmToOilChange(), 10000);

    const listed = response();
    await controller.list({ params: { id: car.id } }, listed);
    assert.deepEqual(listed.body, [{ ...input, id: '1', carId: car.id, date: '2026-10-10T00:00:00.000Z' }]);
});

test('missing car: POST returns 404 without saving and GET returns an empty list', async () => {
    const { controller, records } = setup(null);
    const created = response();
    await controller.create({ params: { id: 'missing' }, body: input }, created);
    assert.equal(created.statusCode, 404);
    assert.deepEqual(created.body, { error: 'Car not found' });
    assert.equal(records.length, 0);
    const listed = response();
    await controller.list({ params: { id: 'missing' } }, listed);
    assert.equal(listed.statusCode, 200);
    assert.deepEqual(listed.body, []);
});

test('missing oil change flag and negative cost preserve existing rules', async () => {
    const car = new Car({ id: 'car-1', name: 'Car', year: 2020, isActive: true });
    const { controller, records } = setup(car);
    await controller.create({ params: { id: car.id }, body: { ...input, isOilChange: undefined } }, response());
    assert.equal(records[0].isOilChange, false);
    await assert.rejects(
        controller.create({ params: { id: car.id }, body: { ...input, cost: -1 } }, response()),
        /Service cost cannot be negative/
    );
    assert.equal(records.length, 1);
});
