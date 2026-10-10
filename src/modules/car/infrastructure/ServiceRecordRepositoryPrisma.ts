import { PrismaClient } from '@prisma/client';
import { ServiceRecord } from '../domain/entity/ServiceRecord';
import { ServiceRecordRepository, StoredServiceRecord } from '../domain/repository/ServiceRecordRepository';

export class ServiceRecordRepositoryPrisma implements ServiceRecordRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(carId: string, record: ServiceRecord): Promise<void> {
        await this.prisma.serviceRecord.create({
            data: {
                carId,
                description: record.description,
                cost: record.cost,
                mileageKm: record.mileageKm,
                date: record.date,
                isOilChange: record.isOilChange
            }
        });
    }

    async findByCarId(carId: string): Promise<StoredServiceRecord[]> {
        return this.prisma.serviceRecord.findMany({
            where: { carId },
            orderBy: { date: 'desc' }
        });
    }
}
