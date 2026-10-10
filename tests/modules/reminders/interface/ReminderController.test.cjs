const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ReminderController } = require('../../../../src/modules/reminders/interface/ReminderController');
const { ReminderError } = require('../../../../src/modules/reminders/application/ReminderUseCases');

function response() {
    return { statusCode: 200, body: undefined, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
}

for (const [method, status, req, expectedArgs] of [
    ['create', 201, { body: { title: 'Oil' } }, [{ title: 'Oil' }]],
    ['list', 200, { query: { moduleKey: 'car' } }, [{ moduleKey: 'car' }]],
    ['update', 200, { params: { id: 'one' }, body: { lifecycle: 'ARCHIVED' } }, ['one', { lifecycle: 'ARCHIVED' }]],
    ['complete', 200, { params: { id: 'one' } }, ['one']]
]) {
    test(`${method} delegates HTTP input and preserves the response`, async () => {
        //Given
        let args;
        const output = { id: 'one' };
        const controller = new ReminderController({ async [method](...values) { args = values; return output; } });
        const res = response();
        //When
        await controller[method](req, res);
        //Then
        assert.deepEqual(args, expectedArgs);
        assert.equal(res.statusCode, status);
        assert.deepEqual(res.body, output);
    });
}

for (const [code, status] of [['INVALID', 400], ['NOT_FOUND', 404], ['INACTIVE', 409]]) {
    test(`maps ${code} to HTTP ${status}`, async () => {
        //Given
        const controller = new ReminderController({ async create() { throw new ReminderError(code, 'Failure'); } });
        const res = response();
        //When
        await controller.create({ body: {} }, res);
        //Then
        assert.equal(res.statusCode, status);
        assert.deepEqual(res.body, { error: 'Failure' });
    });
}

test('unexpected persistence errors propagate instead of becoming validation errors', async () => {
    //Given
    const error = new Error('Storage unavailable');
    const controller = new ReminderController({ async list() { throw error; } });
    //When
    const list = () => controller.list({ query: {} }, response());
    //Then
    await assert.rejects(list, error);
});
