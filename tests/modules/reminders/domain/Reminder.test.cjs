const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Reminder } = require('../../../../src/modules/reminders/domain/Reminder');

const mileageInput = { title: 'Oil change', moduleKey: 'car', resourceId: 'car-1', kind: 'MILEAGE', dueMileageKm: 190000 };
const dateInput = { title: 'Battery', moduleKey: 'car', resourceId: 'car-1', kind: 'DATE', dueDate: '2030-10-10' };

for (const [current, value, status] of [[186000, 4000, 'UPCOMING'], [190000, 0, 'DUE'], [190500, -500, 'OVERDUE'], [0, 190000, 'UPCOMING']]) {
    test(`mileage ${current}: ${status}, ${value} km remaining`, () => {
        //Given
        const reminder = new Reminder(mileageInput);
        const context = { now: new Date('2026-10-10T12:00:00Z'), currentMileageKm: current };
        //When
        const result = reminder.getProgress(context);
        //Then
        assert.deepEqual(result, { status, remaining: { value, unit: 'KM' } });
    });
}

for (const currentMileageKm of [undefined, null]) {
    test(`missing mileage (${currentMileageKm}) is not treated as zero`, () => {
        //Given
        const reminder = new Reminder(mileageInput);
        //When
        const result = reminder.getProgress({ now: new Date('2026-10-10'), currentMileageKm });
        //Then
        assert.deepEqual(result, { status: 'UNKNOWN', remaining: null });
    });
}

const dates = [
    ['four days before', '2030-10-10', '2030-10-06T12:00:00Z', 4, 'UPCOMING'],
    ['due today', '2030-10-10', '2030-10-10T12:00:00Z', 0, 'DUE'],
    ['past due', '2030-10-10', '2030-10-12T12:00:00Z', -2, 'OVERDUE'],
    ['DST start', '2026-03-30', '2026-03-28T23:30:00Z', 1, 'UPCOMING'],
    ['DST end', '2026-10-26', '2026-10-24T22:30:00Z', 1, 'UPCOMING'],
    ['February 29', '2028-03-01', '2028-02-28T23:30:00Z', 1, 'UPCOMING'],
    ['month end', '2026-05-01', '2026-04-30T12:00:00Z', 1, 'UPCOMING'],
    ['new year in Warsaw', '2027-01-01', '2026-12-31T23:30:00Z', 0, 'DUE']
];
for (const [name, dueDate, instant, value, status] of dates) {
    test(`calendar days: ${name}`, () => {
        //Given
        const reminder = new Reminder({ ...dateInput, dueDate });
        const now = new Date(instant);
        //When
        const result = reminder.getProgress({ now });
        //Then
        assert.deepEqual(result, { status, remaining: { value, unit: 'DAYS' } });
    });
}

for (const lifecycle of ['COMPLETED', 'ARCHIVED']) {
    test(`${lifecycle} does not show a countdown or renew the due date`, () => {
        //Given
        const reminder = new Reminder({ ...dateInput, lifecycle });
        //When
        const result = reminder.getProgress({ now: new Date('2031-01-01') });
        //Then
        assert.deepEqual(result, { status: lifecycle, remaining: null });
        assert.equal(reminder.dueDate, '2030-10-10');
    });
}

test('another module preserves its context and multiline information without affecting progress', () => {
    //Given
    const input = { ...dateInput, moduleKey: 'smart-agd', resourceId: 'filter-1', additionalInfo: 'Filter under the sink\nPurchased in May, 180 000 km' };
    const reminder = new Reminder(input);
    //When
    const result = reminder.getProgress({ now: new Date('2030-10-06T12:00:00Z') });
    //Then
    assert.equal(reminder.moduleKey, 'smart-agd');
    assert.equal(reminder.resourceId, 'filter-1');
    assert.equal(reminder.additionalInfo, input.additionalInfo);
    assert.deepEqual(result, { status: 'UPCOMING', remaining: { value: 4, unit: 'DAYS' } });
});

test('a general reminder requires neither a resource nor additional information', () => {
    //Given
    const input = { ...dateInput, moduleKey: 'general', resourceId: undefined };
    //When
    const reminder = new Reminder(input);
    //Then
    assert.equal(reminder.resourceId, null);
    assert.equal(reminder.additionalInfo, null);
    assert.equal(reminder.lifecycle, 'ACTIVE');
});

const invalidInputs = [
    ['empty title', { title: '  ' }, /Title/],
    ['title too long', { title: 'x'.repeat(201) }, /Title/],
    ['empty module', { moduleKey: '' }, /Module key/],
    ['empty resource', { resourceId: '' }, /Resource ID/],
    ['resource on a general reminder', { moduleKey: 'general' }, /General reminders/],
    ['non-text information', { additionalInfo: {} }, /Additional information/],
    ['information too long', { additionalInfo: 'x'.repeat(5001) }, /Additional information/],
    ['unknown kind', { kind: 'HOURS' }, /Unsupported reminder kind/],
    ['unknown lifecycle', { lifecycle: 'INVALID' }, /lifecycle/],
    ['missing date', { dueDate: null }, /requires only a due date/],
    ['both targets', { dueMileageKm: 100 }, /requires only a due date/],
    ['invalid February 29', { dueDate: '2026-02-29' }, /valid YYYY-MM-DD/],
    ['April 31', { dueDate: '2026-04-31' }, /valid YYYY-MM-DD/],
    ['date with time', { dueDate: '2026-10-10T00:00:00Z' }, /valid YYYY-MM-DD/],
    ['year zero', { dueDate: '0000-01-01' }, /valid YYYY-MM-DD/]
];
for (const [name, override, expected] of invalidInputs) {
    test(`validation: ${name}`, () => {
        //Given
        const input = { ...dateInput, ...override };
        //When
        const create = () => new Reminder(input);
        //Then
        assert.throws(create, expected);
    });
}

for (const dueMileageKm of [undefined, null, -1, 1.5, NaN, Infinity, '100', 2147483648]) {
    test(`invalid target mileage: ${dueMileageKm}`, () => {
        //Given
        const input = { ...mileageInput, dueMileageKm };
        //When
        const create = () => new Reminder(input);
        //Then
        assert.throws(create, /non-negative integer target/);
    });
}

for (const override of [{ moduleKey: 'smart-agd' }, { resourceId: null }, { dueDate: '2030-01-01' }]) {
    test(`incompatible mileage context or target: ${JSON.stringify(override)}`, () => {
        //Given
        const input = { ...mileageInput, ...override };
        //When
        const create = () => new Reminder(input);
        //Then
        assert.throws(create, /Mileage reminder requires/);
    });
}

for (const currentMileageKm of [-1, NaN, Infinity, '180000']) {
    test(`invalid mileage reading: ${currentMileageKm}`, () => {
        //Given
        const reminder = new Reminder(mileageInput);
        //When
        const calculate = () => reminder.getProgress({ now: new Date('2026-10-10'), currentMileageKm });
        //Then
        assert.throws(calculate, /finite non-negative number/);
    });
}

test('an invalid clock value is rejected', () => {
    //Given
    const reminder = new Reminder(dateInput);
    //When
    const calculate = () => reminder.getProgress({ now: new Date('invalid') });
    //Then
    assert.throws(calculate, /Current date must be valid/);
});
