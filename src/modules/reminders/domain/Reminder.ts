export type ReminderKind = 'DATE' | 'MILEAGE';
export type ReminderLifecycle = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type ReminderStatus = 'UPCOMING' | 'DUE' | 'OVERDUE' | 'UNKNOWN' | 'COMPLETED' | 'ARCHIVED';

export interface ReminderInput {
    title: string;
    moduleKey: string;
    resourceId?: string | null;
    additionalInfo?: string | null;
    kind: ReminderKind;
    dueDate?: string | null;
    dueMileageKm?: number | null;
    lifecycle?: ReminderLifecycle;
}

export interface ReminderProgress {
    status: ReminderStatus;
    remaining: { value: number; unit: 'DAYS' | 'KM' } | null;
}

// UTC is only a coordinate for calendar days, never the elapsed time between local midnights.
function calendarDay(value: string): number {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) {
        throw new Error('Date must be a valid YYYY-MM-DD calendar day');
    }
    const timestamp = Date.parse(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) {
        throw new Error('Date must be a valid YYYY-MM-DD calendar day');
    }
    return timestamp / 86400000;
}

function warsawDay(now: Date): number {
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
        throw new Error('Current date must be valid');
    }
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const part = (type: string) => parts.find(item => item.type === type)!.value;
    return calendarDay(`${part('year').padStart(4, '0')}-${part('month')}-${part('day')}`);
}

export class Reminder {
    readonly title: string;
    readonly moduleKey: string;
    readonly resourceId: string | null;
    readonly additionalInfo: string | null;
    readonly kind: ReminderKind;
    readonly dueDate: string | null;
    readonly dueMileageKm: number | null;
    readonly lifecycle: ReminderLifecycle;

    constructor(input: ReminderInput) {
        if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 200) {
            throw new Error('Title must contain 1 to 200 characters');
        }
        if (typeof input.moduleKey !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(input.moduleKey)) {
            throw new Error('Module key must be a valid module identifier');
        }
        if (input.resourceId != null && (typeof input.resourceId !== 'string' || !input.resourceId.trim() || input.resourceId.length > 200)) {
            throw new Error('Resource ID must contain 1 to 200 characters');
        }
        if (input.moduleKey === 'general' && input.resourceId != null) {
            throw new Error('General reminders cannot reference a resource');
        }
        if (input.additionalInfo != null && (typeof input.additionalInfo !== 'string' || input.additionalInfo.length > 5000)) {
            throw new Error('Additional information must be text up to 5000 characters');
        }
        if (input.kind !== 'DATE' && input.kind !== 'MILEAGE') {
            throw new Error('Unsupported reminder kind');
        }
        const lifecycle = input.lifecycle ?? 'ACTIVE';
        if (!['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(lifecycle)) {
            throw new Error('Unsupported reminder lifecycle');
        }
        if (input.kind === 'DATE') {
            if (input.dueDate == null || input.dueMileageKm != null) {
                throw new Error('Date reminder requires only a due date');
            }
            calendarDay(input.dueDate);
        } else {
            if (input.moduleKey !== 'car' || !input.resourceId) {
                throw new Error('Mileage reminder requires a car resource');
            }
            if (input.dueDate != null || !Number.isInteger(input.dueMileageKm) || input.dueMileageKm! < 0 || input.dueMileageKm! > 2147483647) {
                throw new Error('Mileage reminder requires only a non-negative integer target');
            }
        }
        this.title = input.title.trim();
        this.moduleKey = input.moduleKey;
        this.resourceId = input.resourceId ?? null;
        this.additionalInfo = input.additionalInfo ?? null;
        this.kind = input.kind;
        this.dueDate = input.dueDate ?? null;
        this.dueMileageKm = input.dueMileageKm ?? null;
        this.lifecycle = lifecycle;
    }

    getProgress(context: { now: Date; currentMileageKm?: number | null }): ReminderProgress {
        if (this.lifecycle !== 'ACTIVE') {
            return { status: this.lifecycle, remaining: null };
        }
        let value: number;
        let unit: 'DAYS' | 'KM';
        if (this.kind === 'DATE') {
            value = calendarDay(this.dueDate!) - warsawDay(context.now);
            unit = 'DAYS';
        } else {
            const current = context.currentMileageKm;
            if (current == null) return { status: 'UNKNOWN', remaining: null };
            if (!Number.isFinite(current) || current < 0) {
                throw new Error('Current mileage must be a finite non-negative number');
            }
            value = this.dueMileageKm! - current;
            unit = 'KM';
        }
        return {
            status: value > 0 ? 'UPCOMING' : value < 0 ? 'OVERDUE' : 'DUE',
            remaining: { value, unit }
        };
    }
}
