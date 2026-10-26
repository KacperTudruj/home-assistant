import { DistanceInput, HealthError, HealthRepository, HealthState, WeightInput } from '../domain/HealthRepository';

function positiveNumber(value: unknown, name: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0
        || Math.abs(value * 100 - Math.round(value * 100)) > 1e-8) {
        throw new HealthError('INVALID', `${name} musi być dodatnią liczbą z maksymalnie dwoma miejscami po przecinku.`);
    }
    return value;
}

function dateOnly(value: unknown): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new HealthError('INVALID', 'Podaj poprawną datę w formacie RRRR-MM-DD.');
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new HealthError('INVALID', 'Podaj poprawną datę w formacie RRRR-MM-DD.');
    }
    return value;
}

function note(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (typeof value !== 'string' || value.trim().length > 300) {
        throw new HealthError('INVALID', 'Notatka może mieć maksymalnie 300 znaków.');
    }
    return value.trim();
}

function bodyObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HealthError('INVALID', 'Niepoprawne dane formularza.');
    return value as Record<string, unknown>;
}

function weightInput(value: unknown): WeightInput & { replaceExisting: boolean } {
    const body = bodyObject(value);
    return {
        date: dateOnly(body.date), kg: positiveNumber(body.kg, 'Waga'), note: note(body.note),
        replaceExisting: body.replaceExisting === true,
    };
}

function distanceInput(value: unknown): DistanceInput {
    const body = bodyObject(value);
    return { date: dateOnly(body.date), km: positiveNumber(body.km, 'Dystans'), note: note(body.note) };
}

export class HealthUseCases {
    constructor(private readonly repository: HealthRepository) {}

    getState(): Promise<HealthState> { return this.repository.getState(); }

    async setGoal(value: unknown): Promise<void> {
        const body = bodyObject(value);
        await this.repository.setGoal(positiveNumber(body.kg, 'Cel'));
    }

    async setPath(value: unknown): Promise<void> {
        const body = bodyObject(value);
        if (body.pathId !== 'frodo') throw new HealthError('INVALID', 'Nieznana ścieżka.');
        await this.repository.setPath(body.pathId);
    }

    async saveWeight(id: string | null, value: unknown): Promise<void> {
        const { replaceExisting, ...input } = weightInput(value);
        if (!await this.repository.saveWeight(id, input, replaceExisting)) throw new HealthError('NOT_FOUND', 'Pomiar nie istnieje.');
    }

    async deleteWeight(id: string): Promise<void> {
        if (!await this.repository.deleteWeight(id)) throw new HealthError('NOT_FOUND', 'Pomiar nie istnieje.');
    }

    async createDistance(value: unknown): Promise<void> {
        await this.repository.createDistance(distanceInput(value));
    }

    async updateDistance(id: string, value: unknown): Promise<void> {
        if (!await this.repository.updateDistance(id, distanceInput(value))) throw new HealthError('NOT_FOUND', 'Wpis dystansu nie istnieje.');
    }

    async deleteDistance(id: string): Promise<void> {
        if (!await this.repository.deleteDistance(id)) throw new HealthError('NOT_FOUND', 'Wpis dystansu nie istnieje.');
    }
}
