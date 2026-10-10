const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Reminder } = require('../../../../src/modules/reminders/domain/Reminder');

const mileageInput = { title: 'Olej', moduleKey: 'car', resourceId: 'auto-1', kind: 'MILEAGE', dueMileageKm: 190000 };
const dateInput = { title: 'Akumulator', moduleKey: 'car', resourceId: 'auto-1', kind: 'DATE', dueDate: '2030-10-10' };

for (const [current, value, status] of [[186000, 4000, 'UPCOMING'], [190000, 0, 'DUE'], [190500, -500, 'OVERDUE'], [0, 190000, 'UPCOMING']]) {
    test(`przebieg ${current}: ${status}, pozostało ${value} km`, () => {
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
    test(`brak przebiegu (${currentMileageKm}) nie oznacza zera`, () => {
        //Given
        const reminder = new Reminder(mileageInput);
        //When
        const result = reminder.getProgress({ now: new Date('2026-10-10'), currentMileageKm });
        //Then
        assert.deepEqual(result, { status: 'UNKNOWN', remaining: null });
    });
}

const dates = [
    ['cztery dni przed', '2030-10-10', '2030-10-06T12:00:00Z', 4, 'UPCOMING'],
    ['termin', '2030-10-10', '2030-10-10T12:00:00Z', 0, 'DUE'],
    ['po terminie', '2030-10-10', '2030-10-12T12:00:00Z', -2, 'OVERDUE'],
    ['początek DST', '2026-03-30', '2026-03-28T23:30:00Z', 1, 'UPCOMING'],
    ['koniec DST', '2026-10-26', '2026-10-24T22:30:00Z', 1, 'UPCOMING'],
    ['29 lutego', '2028-03-01', '2028-02-28T23:30:00Z', 1, 'UPCOMING'],
    ['koniec miesiąca', '2026-05-01', '2026-04-30T12:00:00Z', 1, 'UPCOMING'],
    ['nowy rok w Warszawie', '2027-01-01', '2026-12-31T23:30:00Z', 0, 'DUE']
];
for (const [name, dueDate, instant, value, status] of dates) {
    test(`dni kalendarzowe: ${name}`, () => {
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
    test(`${lifecycle} nie wyświetla aktywnego odliczania i nie odnawia terminu`, () => {
        //Given
        const reminder = new Reminder({ ...dateInput, lifecycle });
        //When
        const result = reminder.getProgress({ now: new Date('2031-01-01') });
        //Then
        assert.deepEqual(result, { status: lifecycle, remaining: null });
        assert.equal(reminder.dueDate, '2030-10-10');
    });
}

test('inny moduł przechowuje własny kontekst i wielowierszowe informacje bez wpływu na wynik', () => {
    //Given
    const input = { ...dateInput, moduleKey: 'smart-agd', resourceId: 'filter-1', additionalInfo: 'Filtr pod zlewem\nKupiony w maju, 180 000 km' };
    const reminder = new Reminder(input);
    //When
    const result = reminder.getProgress({ now: new Date('2030-10-06T12:00:00Z') });
    //Then
    assert.equal(reminder.moduleKey, 'smart-agd');
    assert.equal(reminder.resourceId, 'filter-1');
    assert.equal(reminder.additionalInfo, input.additionalInfo);
    assert.deepEqual(result, { status: 'UPCOMING', remaining: { value: 4, unit: 'DAYS' } });
});

test('przypomnienie ogólne nie wymaga obiektu ani dodatkowych informacji', () => {
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
    ['pusty tytuł', { title: '  ' }, /Title/],
    ['za długi tytuł', { title: 'x'.repeat(201) }, /Title/],
    ['pusty moduł', { moduleKey: '' }, /Module key/],
    ['pusty obiekt', { resourceId: '' }, /Resource ID/],
    ['obiekt ogólnego przypomnienia', { moduleKey: 'general' }, /General reminders/],
    ['informacje nie są tekstem', { additionalInfo: {} }, /Additional information/],
    ['za długie informacje', { additionalInfo: 'x'.repeat(5001) }, /Additional information/],
    ['nieznany rodzaj', { kind: 'HOURS' }, /Unsupported reminder kind/],
    ['nieznany cykl życia', { lifecycle: 'INVALID' }, /lifecycle/],
    ['brak daty', { dueDate: null }, /requires only a due date/],
    ['oba terminy', { dueMileageKm: 100 }, /requires only a due date/],
    ['nieistniejący 29 lutego', { dueDate: '2026-02-29' }, /valid YYYY-MM-DD/],
    ['31 kwietnia', { dueDate: '2026-04-31' }, /valid YYYY-MM-DD/],
    ['data z godziną', { dueDate: '2026-10-10T00:00:00Z' }, /valid YYYY-MM-DD/],
    ['rok zerowy', { dueDate: '0000-01-01' }, /valid YYYY-MM-DD/]
];
for (const [name, override, expected] of invalidInputs) {
    test(`walidacja: ${name}`, () => {
        //Given
        const input = { ...dateInput, ...override };
        //When
        const create = () => new Reminder(input);
        //Then
        assert.throws(create, expected);
    });
}

for (const dueMileageKm of [undefined, null, -1, 1.5, NaN, Infinity, '100', 2147483648]) {
    test(`niepoprawny docelowy przebieg: ${dueMileageKm}`, () => {
        //Given
        const input = { ...mileageInput, dueMileageKm };
        //When
        const create = () => new Reminder(input);
        //Then
        assert.throws(create, /non-negative integer target/);
    });
}

for (const override of [{ moduleKey: 'smart-agd' }, { resourceId: null }, { dueDate: '2030-01-01' }]) {
    test(`niezgodny kontekst lub termin przebiegu: ${JSON.stringify(override)}`, () => {
        //Given
        const input = { ...mileageInput, ...override };
        //When
        const create = () => new Reminder(input);
        //Then
        assert.throws(create, /Mileage reminder requires/);
    });
}

for (const currentMileageKm of [-1, NaN, Infinity, '180000']) {
    test(`niepoprawny odczyt przebiegu: ${currentMileageKm}`, () => {
        //Given
        const reminder = new Reminder(mileageInput);
        //When
        const calculate = () => reminder.getProgress({ now: new Date('2026-10-10'), currentMileageKm });
        //Then
        assert.throws(calculate, /finite non-negative number/);
    });
}

test('niepoprawny zegar jest odrzucany', () => {
    //Given
    const reminder = new Reminder(dateInput);
    //When
    const calculate = () => reminder.getProgress({ now: new Date('invalid') });
    //Then
    assert.throws(calculate, /Current date must be valid/);
});
