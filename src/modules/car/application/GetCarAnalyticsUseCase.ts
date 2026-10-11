import { CarAnalyticsCache } from '../domain/CarAnalyticsCache';
import { FuelAnalyticsFilter, InvalidFuelAnalyticsInputError } from '../domain/FuelAnalyticsCalculator';
import { AnalyticsLimitError, AnalyticsNotFoundError, CarAnalyticsRepository } from '../domain/repository/CarAnalyticsRepository';
import { FuelType } from '../domain/value-object/FuelType';
import { GenerateFuelChartsUseCase } from './GenerateFuelChartsUseCase';

export interface AnalyticsQuery { from?: unknown; to?: unknown; fuelType?: unknown }
export type CarAnalyticsResponse = Awaited<ReturnType<GenerateFuelChartsUseCase['execute']>> & {
    car: { id: string; name: string }; generatedAt: string;
};

function day(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !value.startsWith('0000') &&
        Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function shiftYears(value: string, years: number): Date {
    const date = new Date(`${value}T00:00:00Z`);
    const month = date.getUTCMonth();
    date.setUTCFullYear(date.getUTCFullYear() + years);
    if (date.getUTCMonth() !== month) date.setUTCDate(0); // Clamp February 29 to February 28.
    return date;
}

export class GetCarAnalyticsUseCase {
    constructor(
        private readonly repository: CarAnalyticsRepository,
        private readonly charts: GenerateFuelChartsUseCase,
        private readonly cache: CarAnalyticsCache<CarAnalyticsResponse>,
        private readonly now: () => Date = () => new Date(),
    ) {}

    async execute(carId: string, query: AnalyticsQuery): Promise<CarAnalyticsResponse> {
        if (!carId || ((query.from === undefined) !== (query.to === undefined))) {
            throw new InvalidFuelAnalyticsInputError('Podaj samochód i obie daty zakresu.');
        }
        const today = this.now().toISOString().slice(0, 10);
        const allHistory = query.from === undefined;
        const from = query.from ?? '0001-01-01';
        const to = query.to ?? today;
        const fuelType = query.fuelType ?? FuelType.PB95;
        if (!day(from) || !day(to) || from > to || typeof fuelType !== 'string' || !Object.values(FuelType).includes(fuelType as FuelType)) {
            throw new InvalidFuelAnalyticsInputError('Nieprawidłowe daty lub rodzaj paliwa.');
        }
        const maxTo = shiftYears(from, 5);
        if (!allHistory && new Date(to).getTime() > maxTo.getTime()) throw new AnalyticsLimitError('Wybierz zakres nie dłuższy niż 5 lat.');
        const filter: FuelAnalyticsFilter = { from, to, fuelType: fuelType as FuelType };
        const key = JSON.stringify(['fuel-analytics-v2', filter.from, filter.to, query.fuelType ?? 'auto']);
        return this.cache.getOrLoad(carId, key, async () => {
            const source = await this.repository.read(carId, filter);
            if (!source) throw new AnalyticsNotFoundError('Samochód nie istnieje.');
            const counts = new Map<string, number>();
            for (const record of source.records) {
                if (record.date < from || record.date > to) continue;
                counts.set(record.fuelType, (counts.get(record.fuelType) ?? 0) + 1);
            }
            if ([...counts.values()].some(count => count > 1000)) throw new AnalyticsLimitError('Za dużo punktów. Wybierz węższy zakres.');
            if (query.fuelType === undefined && counts.size) {
                filter.fuelType = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0] as FuelType;
            }
            if (allHistory && source.records.length) filter.from = source.records.reduce((first, record) => record.date < first ? record.date : first, today);
            const result = await this.charts.execute(source.records, filter);
            result.analytics.availableFuelTypes = source.availableFuelTypes;
            return { ...result, car: source.car, generatedAt: this.now().toISOString() };
        });
    }
}
