import { PrismaClient } from '@prisma/client';

import { CarRepository } from '../domain/repository/CarRepository';
import { Car } from '../domain/entity/Car';
import { MileageRecord } from '../domain/entity/MileageRecord';
import { FuelRecord } from '../domain/entity/FuelRecord';
import { ServiceRecord } from '../domain/entity/ServiceRecord';
import { FuelType } from '../domain/value-object/FuelType';

export class CarRepositoryPrisma implements CarRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<Car | null> {
        const carData = await this.prisma.car.findUnique({
            where: { id },
            include: {
                mileageRecords: true,
                fuelRecords: true,
                serviceRecords: true,
            },
        });

        if (!carData) {
            return null;
        }

        const car = new Car({
            id: carData.id,
            name: carData.name,
        });

        // ===== MILEAGE =====
        for (const record of carData.mileageRecords) {
            car.addMileageRecord(
                new MileageRecord({
                    mileageKm: record.mileageKm,
                    date: record.date,
                }),
            );
        }

        // ===== FUEL =====
        for (const record of carData.fuelRecords) {
            car.addFuelRecord(
                new FuelRecord({
                    fuelType: record.fuelType as FuelType,
                    liters: record.liters,
                    totalPrice: record.totalPrice,
                    mileageAtRefuelKm: record.mileageAtRefuelKm,
                    date: record.date,
                }),
            );
        }

        // ===== SERVICE =====
        for (const record of carData.serviceRecords) {
            car.addServiceRecord(
                new ServiceRecord({
                    description: record.description,
                    cost: record.cost,
                    mileageKm: record.mileageKm,
                    date: record.date,
                }),
            );
        }

        return car;
    }

    async save(car: Car): Promise<void> {
        // zapisujemy tylko Car – wpisy dodajemy osobno
        // (na razie prosto i bez magii)

        await this.prisma.car.upsert({
            where: { id: car.id },
            update: {
                name: car.name,
            },
            create: {
                id: car.id,
                name: car.name,
            },
        });
    }
}
