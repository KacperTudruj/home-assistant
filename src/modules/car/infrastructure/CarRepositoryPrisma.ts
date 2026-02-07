import { PrismaClient } from '@prisma/client';

import { CarRepository } from '../domain/repository/CarRepository';
import { Car } from '../domain/entity/Car';
import { MileageRecord } from '../domain/entity/MileageRecord';
import { FuelRecord } from '../domain/entity/FuelRecord';
import { ServiceRecord } from '../domain/entity/ServiceRecord';
import { FuelType } from '../domain/value-object/FuelType';
import { DrivingMode } from '../domain/value-object/DrivingMode';
import { CarMapper } from './CarMapper';

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
            year: carData.year,
            isActive: carData.isActive,
            soldAt: carData.soldAt || undefined,
            engine: carData.engine || undefined,
            vin: carData.vin || undefined,
            mileageAtPurchase: carData.mileageAtPurchase || undefined,
        });

        // Posortuj rekordy po przebiegu rosnąco, aby walidacje w encji nie wybuchały podczas hydratacji
        const mileageRecordsSorted = [...carData.mileageRecords].sort((a, b) => a.mileageKm - b.mileageKm);
        const fuelRecordsSorted = [...carData.fuelRecords].sort((a, b) => a.mileageAtRefuelKm - b.mileageAtRefuelKm);
        const serviceRecordsSorted = [...carData.serviceRecords].sort((a, b) => a.mileageKm - b.mileageKm);

        // ===== MILEAGE =====
        for (const record of mileageRecordsSorted) {
            car.addMileageRecord(
                new MileageRecord({
                    mileageKm: record.mileageKm,
                    date: record.date,
                }),
            );
        }

        // ===== FUEL =====
        for (const record of fuelRecordsSorted) {
            car.addFuelRecord(
                new FuelRecord({
                    fuelType: record.fuelType as FuelType,
                    liters: record.liters,
                    totalPrice: record.totalPrice,
                    mileageAtRefuelKm: record.mileageAtRefuelKm,
                    tripDistance: record.tripDistance,
                    date: record.date,
                    drivingMode: record.drivingMode as DrivingMode,
                }),
            );
        }

        // ===== SERVICE =====
        for (const record of serviceRecordsSorted) {
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

    async list(): Promise<Car[]> {
        const cars = await this.prisma.car.findMany({
            orderBy: {
                createdAt: "asc",
            },
        });
        
        return cars.map(CarMapper.fromPrisma);
    }

    async save(car: Car): Promise<void> {
        // zapisujemy tylko Car – wpisy dodajemy osobno
        // (na razie prosto i bez magii)

        await this.prisma.car.upsert({
            where: { id: car.id },
            update: {
                name: car.name,
                year: car.year,
                engine: car.engine,
                vin: car.vin,
                mileageAtPurchase: car.mileageAtPurchase,
            },
            create: {
                id: car.id,
                name: car.name,
                year: car.year,
                engine: car.engine,
                vin: car.vin,
                mileageAtPurchase: car.mileageAtPurchase,
            },
        });
    }
}
