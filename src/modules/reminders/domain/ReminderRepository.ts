import { Reminder, ReminderLifecycle } from './Reminder';

export interface StoredReminder {
    id: string;
    reminder: Reminder;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReminderFilter {
    moduleKey?: string;
    resourceId?: string;
    lifecycle?: ReminderLifecycle;
}

export interface ReminderRepository {
    create(reminder: Reminder): Promise<StoredReminder>;
    findById(id: string): Promise<StoredReminder | null>;
    list(filter: ReminderFilter): Promise<StoredReminder[]>;
    update(id: string, changes: Partial<Reminder>): Promise<StoredReminder>;
}
