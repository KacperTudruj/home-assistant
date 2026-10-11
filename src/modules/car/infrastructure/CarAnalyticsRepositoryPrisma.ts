import { PrismaClient } from '@prisma/client';
import { AnalyticsFuelRecord, FuelAnalyticsCalculator, FuelAnalyticsFilter } from '../domain/FuelAnalyticsCalculator';
import { AnalyticsLimitError, CarAnalyticsRepository, CarAnalyticsSource } from '../domain/repository/CarAnalyticsRepository';
import { FuelType } from '../domain/value-object/FuelType';

export class CarAnalyticsRepositoryPrisma implements CarAnalyticsRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async read(carId: string, filter: FuelAnalyticsFilter): Promise<CarAnalyticsSource | null> {
        return this.prisma.$transaction(async tx => {
            const car = await tx.car.findUnique({ where: { id: carId }, select: { id: true, name: true } });
            if (!car) return null;
            const from = new Date(`${filter.from}T00:00:00.000Z`);
            const end = new Date(`${filter.to}T00:00:00.000Z`);
            end.setUTCDate(end.getUTCDate() + 1);
            const select = { id: true, date: true, fuelType: true, liters: true, totalPrice: true, mileageAtRefuelKm: true, tripDistance: true } as const;
            const rows = await tx.fuelRecord.findMany({
                where: { carId, date: { gte: from, lt: end } }, select,
                orderBy: [{ date: 'asc' }, { id: 'asc' }], take: 5001,
            });
            if (rows.length > 5000) throw new AnalyticsLimitError('Za dużo tankowań. Wybierz węższy zakres.');
            const fuels = await tx.fuelRecord.groupBy({ by: ['fuelType'], where: { carId } });
            const map = (row: typeof rows[number]): AnalyticsFuelRecord => ({
                ...row, date: row.date.toISOString().slice(0, 10), fuelType: row.fuelType as FuelType,
            });
            const result = (context: AnalyticsFuelRecord[]): CarAnalyticsSource => ({
                car, records: [...context, ...rows.map(map)],
                availableFuelTypes: fuels.map(row => row.fuelType as FuelType).sort(),
            });
            // No visible points need a baseline when the range is empty.
            if (!rows.length) return result([]);
            const history: typeof rows = [];
            let cursor: typeof rows[number] | undefined;
            while (true) {
                const remaining = 5000 - rows.length - history.length;
                const take = Math.min(100, remaining + 1); // One sentinel detects exhaustion of the budget.
                const batch = await tx.fuelRecord.findMany({
                    where: { carId, date: { lt: from }, ...(cursor ? { OR: [
                        { date: { lt: cursor.date } },
                        { date: cursor.date, id: { lt: cursor.id } },
                    ] } : {}) },
                    select, orderBy: [{ date: 'desc' }, { id: 'desc' }], take,
                });
                if (batch.length > remaining) throw new AnalyticsLimitError('Za dużo danych kontekstu. Wybierz węższy lub wcześniejszy zakres.');
                history.push(...batch);
                if (batch.length < take) return result(history.map(map));
                cursor = batch[batch.length - 1];
                // The oldest fetched day may be incomplete. Never infer its ordering.
                const earliestDay = cursor.date.toISOString().slice(0, 10);
                const complete = history.map(map).filter(row => row.date > earliestDay);
                if (!complete.length) continue;
                const firstCompleteDay = complete[complete.length - 1].date;
                const analysis = new FuelAnalyticsCalculator().calculate(complete, { ...filter, from: firstCompleteDay });
                // Exclude the first complete day too: its predecessor is not available yet.
                if (analysis.points.filter(point => point.date > firstCompleteDay && point.consumption !== null).length >= 5) {
                    return result(complete);
                }
            }
        }, { isolationLevel: 'RepeatableRead' });
    }
}
