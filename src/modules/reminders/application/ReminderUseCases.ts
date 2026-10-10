import { Reminder, ReminderInput } from '../domain/Reminder';
import { ReminderContext, ReminderContextProvider } from '../domain/ReminderContextProvider';
import { ReminderFilter, ReminderRepository, StoredReminder } from '../domain/ReminderRepository';

export class ReminderError extends Error {
    constructor(readonly code: 'INVALID' | 'NOT_FOUND' | 'INACTIVE', message: string) {
        super(message);
    }
}

const fields = ['title', 'moduleKey', 'resourceId', 'additionalInfo', 'kind', 'dueDate', 'dueMileageKm', 'lifecycle'];

export class ReminderUseCases {
    constructor(
        private readonly repository: ReminderRepository,
        private readonly providers: ReadonlyMap<string, ReminderContextProvider>,
        private readonly now: () => Date = () => new Date()
    ) {}

    private object(value: unknown, allowed: string[]): Record<string, unknown> {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new ReminderError('INVALID', 'Expected an object');
        }
        const data = value as Record<string, unknown>;
        if (Object.keys(data).some(key => !allowed.includes(key))) {
            throw new ReminderError('INVALID', 'Unsupported field');
        }
        return data;
    }

    private validate(input: Record<string, unknown>): Reminder {
        if ('lifecycle' in input && typeof input.lifecycle !== 'string') {
            throw new ReminderError('INVALID', 'Lifecycle must be a string');
        }
        try {
            return new Reminder(input as unknown as ReminderInput);
        } catch (error) {
            throw new ReminderError('INVALID', error instanceof Error ? error.message : 'Invalid reminder');
        }
    }

    private async context(reminder: Reminder): Promise<ReminderContext> {
        if (reminder.moduleKey === 'general') {
            return { exists: true, active: true, currentMileageKm: null, mileageRecordedAt: null, mileageSource: null };
        }
        const provider = this.providers.get(reminder.moduleKey);
        if (!provider) throw new ReminderError('INVALID', 'Unsupported module');
        return provider.getContext(reminder.resourceId);
    }

    private writable(context: ReminderContext): void {
        if (!context.exists) throw new ReminderError('NOT_FOUND', 'Resource not found');
        if (!context.active) throw new ReminderError('INACTIVE', 'Resource is inactive');
    }

    private present(stored: StoredReminder, context: ReminderContext, now: Date) {
        return {
            id: stored.id, ...stored.reminder,
            createdAt: stored.createdAt, updatedAt: stored.updatedAt,
            ...stored.reminder.getProgress({ now, currentMileageKm: context.exists ? context.currentMileageKm : null }),
            contextAvailable: context.exists, contextActive: context.active,
            currentMileageKm: context.exists ? context.currentMileageKm : null,
            mileageRecordedAt: context.mileageRecordedAt, mileageSource: context.mileageSource,
            calculatedAt: now
        };
    }

    async create(body: unknown) {
        const reminder = this.validate(this.object(body, fields));
        const context = await this.context(reminder);
        this.writable(context);
        const stored = await this.repository.create(reminder);
        return this.present(stored, context, this.now());
    }

    async list(query: unknown) {
        const input = this.object(query, ['moduleKey', 'resourceId', 'lifecycle']);
        for (const value of Object.values(input)) {
            if (typeof value !== 'string' || !value.trim()) throw new ReminderError('INVALID', 'Filters must be non-empty strings');
        }
        const filter = input as ReminderFilter;
        if (filter.resourceId && !filter.moduleKey) throw new ReminderError('INVALID', 'Resource filter requires moduleKey');
        if (filter.moduleKey && filter.moduleKey !== 'general' && !this.providers.has(filter.moduleKey)) {
            throw new ReminderError('INVALID', 'Unsupported module');
        }
        if (filter.moduleKey === 'general' && filter.resourceId) throw new ReminderError('INVALID', 'General reminders have no resource');
        if (filter.lifecycle && !['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(filter.lifecycle)) {
            throw new ReminderError('INVALID', 'Unsupported lifecycle');
        }
        const now = this.now();
        const records = await this.repository.list(filter);
        return Promise.all(records.map(async stored => this.present(stored, await this.context(stored.reminder), now)));
    }

    async update(id: string, body: unknown) {
        // Context is immutable: an edit cannot silently move a reminder to another resource.
        const input = this.object(body, fields.filter(field => field !== 'moduleKey' && field !== 'resourceId'));
        if (!Object.keys(input).length) throw new ReminderError('INVALID', 'At least one field is required');
        const stored = await this.repository.findById(id);
        if (!stored) throw new ReminderError('NOT_FOUND', 'Reminder not found');
        const reminder = this.validate({ ...stored.reminder, ...input });
        const context = await this.context(reminder);
        const onlyArchive = Object.keys(input).length === 1 && input.lifecycle === 'ARCHIVED';
        if (!onlyArchive) this.writable(context);
        const changes: Record<string, unknown> = {};
        for (const key of Object.keys(input)) changes[key] = reminder[key as keyof ReminderInput];
        const updated = await this.repository.update(id, changes);
        return this.present(updated, context, this.now());
    }

    async complete(id: string) {
        const stored = await this.repository.findById(id);
        if (!stored) throw new ReminderError('NOT_FOUND', 'Reminder not found');
        const context = await this.context(stored.reminder);
        if (stored.reminder.lifecycle === 'COMPLETED') return this.present(stored, context, this.now());
        if (stored.reminder.lifecycle === 'ARCHIVED') throw new ReminderError('INVALID', 'Archived reminder cannot be completed');
        this.writable(context);
        const updated = await this.repository.update(id, { lifecycle: 'COMPLETED' });
        return this.present(updated, context, this.now());
    }
}
