const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Reminder } = require('../../../../src/modules/reminders/domain/Reminder');
const { ReminderUseCases } = require('../../../../src/modules/reminders/application/ReminderUseCases');

const dateInput = { title: 'Battery', moduleKey: 'general', kind: 'DATE', dueDate: '2030-10-10' };
const mileageInput = { title: 'Oil', moduleKey: 'car', resourceId: 'one', kind: 'MILEAGE', dueMileageKm: 190000 };

function setup() {
    const rows = [];
    let writes = 0;
    const now = new Date('2030-10-06T12:00:00Z');
    const context = { exists: true, active: true, currentMileageKm: 186000, mileageRecordedAt: now, mileageSource: 'READING' };
    const repository = {
        async create(reminder) { const row = { id: String(rows.length + 1), reminder, createdAt: now, updatedAt: now }; rows.push(row); return row; },
        async findById(id) { return rows.find(row => row.id === id) ?? null; },
        async list(filter) { return rows.filter(row => Object.entries(filter).every(([key, value]) => row.reminder[key] === value)); },
        async update(id, changes) { writes++; const row = rows.find(row => row.id === id); row.reminder = new Reminder({ ...row.reminder, ...changes }); return row; }
    };
    const providers = new Map([
        ['car', { async getContext() { return context; } }],
        ['smart-agd', { async getContext() { return { ...context, currentMileageKm: null }; } }]
    ]);
    return { service: new ReminderUseCases(repository, providers, () => now), context, rows, writes: () => writes };
}

test('creates a standalone date reminder with additional information and four days remaining', async () => {
    //Given
    const { service } = setup();
    //When
    const result = await service.create({ ...dateInput, additionalInfo: 'Installed in October\nKeep receipt' });
    //Then
    assert.deepEqual(result.remaining, { value: 4, unit: 'DAYS' });
    assert.equal(result.additionalInfo, 'Installed in October\nKeep receipt');
    assert.equal(result.status, 'UPCOMING');
});

test('reads mileage from the context provider on each request', async () => {
    //Given
    const { service, context } = setup();
    await service.create(mileageInput);
    context.currentMileageKm = 190500;
    //When
    const [result] = await service.list({ moduleKey: 'car', resourceId: 'one' });
    //Then
    assert.equal(result.status, 'OVERDUE');
    assert.deepEqual(result.remaining, { value: -500, unit: 'KM' });
    assert.equal(result.mileageSource, 'READING');
});

test('isolates equal resource IDs in different modules and different cars', async () => {
    //Given
    const { service } = setup();
    await service.create(mileageInput);
    await service.create({ ...mileageInput, resourceId: 'two' });
    await service.create({ ...dateInput, moduleKey: 'smart-agd', resourceId: 'one' });
    //When
    const results = await service.list({ moduleKey: 'car', resourceId: 'one' });
    //Then
    assert.equal(results.length, 1);
    assert.equal(results[0].kind, 'MILEAGE');
});

test('edits information and manually changes the target without changing context', async () => {
    //Given
    const { service } = setup();
    const created = await service.create(mileageInput);
    //When
    const result = await service.update(created.id, { dueMileageKm: 195000, additionalInfo: 'New oil' });
    //Then
    assert.equal(result.remaining.value, 9000);
    assert.equal(result.additionalInfo, 'New oil');
    assert.equal(result.resourceId, 'one');
});

test('completion is repeatable without another write or a new deadline', async () => {
    //Given
    const { service, writes, rows } = setup();
    const created = await service.create(dateInput);
    await service.complete(created.id);
    //When
    const result = await service.complete(created.id);
    //Then
    assert.equal(writes(), 1);
    assert.equal(rows.length, 1);
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.remaining, null);
    assert.equal(result.dueDate, dateInput.dueDate);
});

test('missing resource produces UNKNOWN and can still be archived', async () => {
    //Given
    const { service, context } = setup();
    const created = await service.create(mileageInput);
    context.exists = false;
    //When
    const [listed] = await service.list({});
    const archived = await service.update(created.id, { lifecycle: 'ARCHIVED' });
    //Then
    assert.equal(listed.status, 'UNKNOWN');
    assert.equal(listed.contextAvailable, false);
    assert.equal(archived.status, 'ARCHIVED');
});

test('inactive cars allow reading and archiving but reject creation and edits', async () => {
    //Given
    const { service, context } = setup();
    const created = await service.create(mileageInput);
    context.active = false;
    //When
    const create = () => service.create(mileageInput);
    const update = () => service.update(created.id, { dueMileageKm: 200000 });
    const listed = await service.list({});
    const archived = await service.update(created.id, { lifecycle: 'ARCHIVED' });
    //Then
    await assert.rejects(create, { code: 'INACTIVE' });
    await assert.rejects(update, { code: 'INACTIVE' });
    assert.equal(listed.length, 1);
    assert.equal(archived.lifecycle, 'ARCHIVED');
});

test('completion on an inactive car is rejected without writing', async () => {
    //Given
    const { service, context, writes } = setup();
    const created = await service.create(mileageInput);
    context.active = false;
    //When
    const complete = () => service.complete(created.id);
    //Then
    await assert.rejects(complete, { code: 'INACTIVE' });
    assert.equal(writes(), 0);
});

test('switches target explicitly, clears information and filters completed reminders', async () => {
    //Given
    const { service } = setup();
    const created = await service.create({ ...mileageInput, additionalInfo: 'Old note' });
    //When
    const updated = await service.update(created.id, { kind: 'DATE', dueDate: '2030-10-10', dueMileageKm: null, additionalInfo: null });
    await service.complete(created.id);
    const completed = await service.list({ lifecycle: 'COMPLETED' });
    const active = await service.list({ lifecycle: 'ACTIVE' });
    //Then
    assert.equal(updated.additionalInfo, null);
    assert.deepEqual(updated.remaining, { value: 4, unit: 'DAYS' });
    assert.equal(completed.length, 1);
    assert.equal(active.length, 0);
});

for (const body of [null, [], {}, { ...dateInput, moduleKey: 'unknown' }, { ...dateInput, lifecycle: null }, { ...dateInput, surprise: true }, { ...mileageInput, dueMileageKm: '190000' }]) {
    test(`rejects invalid creation: ${JSON.stringify(body)}`, async () => {
        //Given
        const { service, rows } = setup();
        //When
        const create = () => service.create(body);
        //Then
        await assert.rejects(create, { code: 'INVALID' });
        assert.equal(rows.length, 0);
    });
}

for (const filter of [{ resourceId: 'one' }, { moduleKey: ['car'] }, { moduleKey: 'unknown' }, { lifecycle: 'WRONG' }, { moduleKey: 'general', resourceId: 'one' }]) {
    test(`rejects invalid filters: ${JSON.stringify(filter)}`, async () => {
        //Given
        const { service } = setup();
        //When
        const list = () => service.list(filter);
        //Then
        await assert.rejects(list, { code: 'INVALID' });
    });
}

test('rejects missing reminders and resources without persistence', async () => {
    //Given
    const { service, context, rows } = setup();
    context.exists = false;
    //When
    const create = () => service.create(mileageInput);
    const update = () => service.update('missing', { title: 'Changed' });
    const complete = () => service.complete('missing');
    //Then
    await assert.rejects(create, { code: 'NOT_FOUND' });
    await assert.rejects(update, { code: 'NOT_FOUND' });
    await assert.rejects(complete, { code: 'NOT_FOUND' });
    assert.equal(rows.length, 0);
});

test('rejects context changes and requires clearing the old target when switching kind', async () => {
    //Given
    const { service } = setup();
    const created = await service.create(mileageInput);
    //When
    const move = () => service.update(created.id, { resourceId: 'two' });
    const invalidSwitch = () => service.update(created.id, { kind: 'DATE', dueDate: '2030-10-10' });
    //Then
    await assert.rejects(move, { code: 'INVALID' });
    await assert.rejects(invalidSwitch, { code: 'INVALID' });
});
