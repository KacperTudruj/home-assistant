const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseServiceLabel, SERVICE_LABELS, InvalidServiceLabelError } = require('../../../../../src/modules/car/domain/value-object/ServiceLabel');

test('domain labels match the generated database enum', () => {
    //Given
    const { ServiceLabel } = require('@prisma/client');
    //When
    const databaseLabels = Object.values(ServiceLabel);
    //Then
    assert.deepEqual([...SERVICE_LABELS].sort(), databaseLabels.sort());
});

for (const value of SERVICE_LABELS) {
    test(`accepts descriptive label ${value}`, () => {
        //Given
        const input = value;
        //When
        const result = parseServiceLabel(input);
        //Then
        assert.equal(result, value);
    });
}

for (const value of [null, undefined]) {
    test(`accepts absence of a label: ${value}`, () => {
        //Given
        const input = value;
        //When
        const result = parseServiceLabel(input);
        //Then
        assert.equal(result, null);
    });
}

for (const value of ['', 'OTHER', true, ['OIL_CHANGE'], 1]) {
    test(`rejects invalid label ${JSON.stringify(value)}`, () => {
        //Given
        const input = value;
        //When
        const parse = () => parseServiceLabel(input);
        //Then
        assert.throws(parse, InvalidServiceLabelError);
    });
}
