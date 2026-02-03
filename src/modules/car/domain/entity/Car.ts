import { FuelRecord } from './FuelRecord';
import { MileageRecord } from './MileageRecord';
import { ServiceRecord } from './ServiceRecord';

export class Car {
    readonly id: string;
    readonly name: string;
    readonly year: number;
    readonly isActive: boolean;
    readonly soldAt?: Date;
    readonly engine?: string;
    readonly vin?: string;
    readonly mileageAtPurchase?: number;

    private mileageRecords: MileageRecord[] = [];
    private fuelRecords: FuelRecord[] = [];
    private serviceRecords: ServiceRecord[] = [];

    constructor(params: {
        id: string;
        name: string;
        year: number;
        isActive: boolean;
        soldAt?: Date;
        engine?: string;
        vin?: string;
        mileageAtPurchase?: number;
    }) {
        this.id = params.id;
        this.name = params.name;
        this.year = params.year;
        this.isActive = params.isActive;
        this.soldAt = params.soldAt;
        this.engine = params.engine;
        this.vin = params.vin;
        this.mileageAtPurchase = params.mileageAtPurchase;
    }

    // ===== MILEAGE =====

    addMileageRecord(record: MileageRecord): void {
        const last = this.getLatestMileage();

        if (last && record.mileageKm < last.mileageKm) {
            throw new Error('Mileage cannot decrease');
        }

        this.mileageRecords.push(record);
    }

    getLatestMileage(): { mileageKm: number; date: Date } | undefined {
        const allReadings: { mileageKm: number; date: Date }[] = [
            ...this.mileageRecords.map(r => ({ mileageKm: r.mileageKm, date: r.date })),
            ...this.fuelRecords.map(r => ({ mileageKm: r.mileageAtRefuelKm, date: r.date })),
            ...this.serviceRecords.map(r => ({ mileageKm: r.mileageKm, date: r.date }))
        ];

        if (allReadings.length === 0) {
            return undefined;
        }

        return allReadings
            .sort((a, b) => b.mileageKm - a.mileageKm)[0];
    }

    // ===== FUEL =====

    addFuelRecord(record: FuelRecord): void {
        const lastMileage = this.getLatestMileage();

        if (lastMileage && record.mileageAtRefuelKm < lastMileage.mileageKm) {
            throw new Error('Fgrd mileage is lower than latest mileage');
        }

        this.fuelRecords.push(record);
    }

    // ===== SERVICE =====

    addServiceRecord(record: ServiceRecord): void {
        this.serviceRecords.push(record);
    }

    // ===== ANALYSIS =====

    calculateAverageFuelConsumption(): {
        averageConsumption?: number;
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        missingMileageKm?: number;
    } {
        if (this.fuelRecords.length < 2) {
            return { confidence: 'LOW' };
        }

        const sorted = this.fuelRecords
            .slice()
            .sort((a, b) => a.mileageAtRefuelKm - b.mileageAtRefuelKm);

        let totalLiters = 0;
        let totalDistance = 0;

        for (let i = 1; i < sorted.length; i++) {
            const distance =
                sorted[i].mileageAtRefuelKm -
                sorted[i - 1].mileageAtRefuelKm;

            if (distance <= 0) continue;

            totalDistance += distance;
            totalLiters += sorted[i].liters;
        }

        if (totalDistance <= 0) {
            return { confidence: 'LOW' };
        }

        const avg = (totalLiters / totalDistance) * 100;

        return {
            averageConsumption: Number(avg.toFixed(2)),
            confidence: 'MEDIUM',
        };
    }
}
