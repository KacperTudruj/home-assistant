const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ServiceRecord } = require('../../../../src/modules/car/domain/entity/ServiceRecord');
const { ServiceRecordRepositoryPrisma } = require('../../../../src/modules/car/infrastructure/ServiceRecordRepositoryPrisma');

test('persists and reads multiline descriptions and workshop details', async () => {
    //Given
    let saved;
    const prisma = { serviceRecord: {
        async create({ data }) { saved = { id: 'visit-1', ...data }; },
        async findMany() { return [saved]; }
    } };
    const repository = new ServiceRecordRepositoryPrisma(prisma);
    const record = new ServiceRecord({ description: 'Oil\nFilters', cost: 800, mileageKm: 180000, date: new Date('2026-10-10'), workshopName: 'Garage', workshopAddress: 'Street\nCity' });
    //When
    await repository.create('car-1', record);
    const [result] = await repository.findByCarId('car-1');
    //Then
    assert.equal(result.description, record.description);
    assert.equal(result.workshopName, 'Garage');
    assert.equal(result.workshopAddress, 'Street\nCity');
    assert.equal(result.cost, 800);
});
