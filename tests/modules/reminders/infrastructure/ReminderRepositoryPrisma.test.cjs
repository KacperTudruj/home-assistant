const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Reminder } = require('../../../../src/modules/reminders/domain/Reminder');
const { ReminderRepositoryPrisma } = require('../../../../src/modules/reminders/infrastructure/ReminderRepositoryPrisma');

test('maps calendar dates to UTC midnight and back without connecting to Prisma', async () => {
    //Given
    let saved;
    const reminder = new Reminder({ title: 'Battery', moduleKey: 'general', kind: 'DATE', dueDate: '2030-10-10' });
    const repository = new ReminderRepositoryPrisma({ reminder: {
        async create({ data }) { saved = data; return { ...data, id: 'one', createdAt: new Date(), updatedAt: new Date() }; }
    } });
    //When
    const result = await repository.create(reminder);
    //Then
    assert.equal(saved.dueDate.toISOString(), '2030-10-10T00:00:00.000Z');
    assert.equal(result.reminder.dueDate, '2030-10-10');
});

test('list forwards both context filters and lifecycle to persistence', async () => {
    //Given
    let query;
    const repository = new ReminderRepositoryPrisma({ reminder: { async findMany(input) { query = input; return []; } } });
    const filter = { moduleKey: 'car', resourceId: 'one', lifecycle: 'ACTIVE' };
    //When
    const result = await repository.list(filter);
    //Then
    assert.deepEqual(query.where, filter);
    assert.deepEqual(query.orderBy, [{ createdAt: 'desc' }, { id: 'asc' }]);
    assert.deepEqual(result, []);
});
