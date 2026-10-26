import { Prisma, PrismaClient } from '@prisma/client';
import { DistanceInput, HealthError, HealthRepository, HealthState, WeightInput } from '../domain/HealthRepository';

const asDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
const asKey = (value: Date) => value.toISOString().slice(0, 10);

export class HealthRepositoryPrisma implements HealthRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async getState(): Promise<HealthState> {
        const [profile, weights, distances] = await Promise.all([
            this.prisma.healthProfile.findUnique({ where: { id: 1 } }),
            this.prisma.healthWeightRecord.findMany({ orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] }),
            this.prisma.healthDistanceRecord.findMany({ orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] }),
        ]);
        return {
            goalKg: profile?.goalKg ?? null,
            pathId: profile?.pathId ?? 'frodo',
            weights: weights.map(item => ({ id: item.id, date: asKey(item.date), kg: item.kg, note: item.note ?? '' })),
            distances: distances.map(item => ({ id: item.id, date: asKey(item.date), km: item.km, note: item.note ?? '' })),
        };
    }

    async setGoal(kg: number): Promise<void> {
        await this.prisma.healthProfile.upsert({ where: { id: 1 }, create: { id: 1, goalKg: kg }, update: { goalKg: kg } });
    }

    async setPath(pathId: string): Promise<void> {
        await this.prisma.healthProfile.upsert({ where: { id: 1 }, create: { id: 1, pathId }, update: { pathId } });
    }

    async saveWeight(id: string | null, input: WeightInput, replaceExisting: boolean): Promise<boolean> {
        const date = asDate(input.date);
        try {
            return await this.prisma.$transaction(async tx => {
                if (id && !await tx.healthWeightRecord.findUnique({ where: { id } })) return false;
                const sameDay = await tx.healthWeightRecord.findUnique({ where: { date } });
                if (sameDay && sameDay.id !== id) {
                    if (!replaceExisting) throw new HealthError('CONFLICT', 'Pomiar z tego dnia już istnieje.');
                    if (id) await tx.healthWeightRecord.delete({ where: { id: sameDay.id } });
                    else {
                        await tx.healthWeightRecord.update({ where: { id: sameDay.id }, data: { kg: input.kg, note: input.note || null } });
                        return true;
                    }
                }
                if (id) await tx.healthWeightRecord.update({ where: { id }, data: { date, kg: input.kg, note: input.note || null } });
                else await tx.healthWeightRecord.create({ data: { date, kg: input.kg, note: input.note || null } });
                return true;
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new HealthError('CONFLICT', 'Pomiar z tego dnia już istnieje.');
            }
            throw error;
        }
    }

    async deleteWeight(id: string): Promise<boolean> {
        return (await this.prisma.healthWeightRecord.deleteMany({ where: { id } })).count > 0;
    }

    async createDistance(input: DistanceInput): Promise<void> {
        await this.prisma.healthDistanceRecord.create({ data: { date: asDate(input.date), km: input.km, note: input.note || null } });
    }

    async updateDistance(id: string, input: DistanceInput): Promise<boolean> {
        return (await this.prisma.healthDistanceRecord.updateMany({
            where: { id }, data: { date: asDate(input.date), km: input.km, note: input.note || null },
        })).count > 0;
    }

    async deleteDistance(id: string): Promise<boolean> {
        return (await this.prisma.healthDistanceRecord.deleteMany({ where: { id } })).count > 0;
    }
}
