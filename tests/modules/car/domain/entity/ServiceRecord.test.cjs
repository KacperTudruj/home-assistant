const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ServiceRecord, InvalidServiceLocationError } = require('../../../../../src/modules/car/domain/entity/ServiceRecord');

const input = { description: 'Oil\nFilters', cost: 800, mileageKm: 180000, date: new Date('2026-10-10') };

for (const value of [undefined, null, '', '  ']) {
    test(`normalizes empty optional workshop fields: ${JSON.stringify(value)}`, () => {
        //Given
        const data = { ...input, workshopName: value, workshopAddress: value };
        //When
        const record = new ServiceRecord(data);
        //Then
        assert.equal(record.workshopName, null);
        assert.equal(record.workshopAddress, null);
        assert.equal(record.description, input.description);
    });
}

for (const fields of [{ workshopName: 123 }, { workshopAddress: [] }, { workshopName: 'x'.repeat(201) }, { workshopAddress: 'x'.repeat(501) }]) {
    test(`rejects invalid workshop fields: ${Object.keys(fields)[0]} (${typeof Object.values(fields)[0]})`, () => {
        //Given
        const data = { ...input, ...fields };
        //When
        const create = () => new ServiceRecord(data);
        //Then
        assert.throws(create, InvalidServiceLocationError);
    });
}
