const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Car } = require('../../../../src/modules/car/domain/entity/Car');
const { CarReminderContextProvider } = require('../../../../src/modules/car/infrastructure/CarReminderContextProvider');

for (const [purchase, expected] of [[undefined, null], [0, null], [180000, 180000]]) {
    test(`purchase mileage ${purchase} uses a reliable baseline only`, async () => {
        //Given
        const car = new Car({ id: 'one', name: 'Car', year: 2020, isActive: true, mileageAtPurchase: purchase });
        const provider = new CarReminderContextProvider({ async findById() { return car; } });
        //When
        const result = await provider.getContext('one');
        //Then
        assert.equal(result.currentMileageKm, expected);
        assert.equal(result.mileageSource, expected === null ? null : 'PURCHASE');
    });
}

test('uses the existing highest reading and reports its date and inactive state', async () => {
    //Given
    const car = new Car({ id: 'one', name: 'Car', year: 2020, isActive: false, mileageAtPurchase: 100000 });
    car.addServiceRecord({ mileageKm: 180000, date: new Date('2030-01-01') });
    car.addServiceRecord({ mileageKm: 170000, date: new Date('2030-02-01') });
    const provider = new CarReminderContextProvider({ async findById() { return car; } });
    //When
    const result = await provider.getContext('one');
    //Then
    assert.equal(result.currentMileageKm, 180000);
    assert.equal(result.mileageRecordedAt.toISOString(), '2030-01-01T00:00:00.000Z');
    assert.equal(result.active, false);
});
