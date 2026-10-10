import { PrismaClient, Reminder as PrismaReminder } from '@prisma/client';
import { Reminder } from '../domain/Reminder';
import { ReminderFilter, ReminderRepository, StoredReminder } from '../domain/ReminderRepository';

export class ReminderRepositoryPrisma implements ReminderRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private map(row: PrismaReminder): StoredReminder {
        return {
            id: row.id, createdAt: row.createdAt, updatedAt: row.updatedAt,
            reminder: new Reminder({ ...row, dueDate: row.dueDate?.toISOString().slice(0, 10) ?? null })
        };
    }

    private data(reminder: Partial<Reminder>) {
        const { dueDate, ...rest } = reminder;
        return { ...rest, ...(dueDate !== undefined ? { dueDate: dueDate === null ? null : new Date(`${dueDate}T00:00:00.000Z`) } : {}) };
    }

    async create(reminder: Reminder): Promise<StoredReminder> {
        return this.map(await this.prisma.reminder.create({ data: {
            ...reminder, dueDate: reminder.dueDate ? new Date(`${reminder.dueDate}T00:00:00.000Z`) : null
        } }));
    }

    async findById(id: string): Promise<StoredReminder | null> {
        const row = await this.prisma.reminder.findUnique({ where: { id } });
        return row ? this.map(row) : null;
    }

    async list(filter: ReminderFilter): Promise<StoredReminder[]> {
        return (await this.prisma.reminder.findMany({ where: filter, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] })).map(row => this.map(row));
    }

    async update(id: string, changes: Partial<Reminder>): Promise<StoredReminder> {
        return this.map(await this.prisma.reminder.update({ where: { id }, data: this.data(changes) }));
    }
}
