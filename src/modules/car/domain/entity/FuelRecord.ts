import { FuelType } from '../value-object/FuelType';
import { DrivingMode } from '../value-object/DrivingMode';

export class FuelRecord {
    readonly fuelType: FuelType;
    readonly liters: number;
    readonly totalPrice: number;
    readonly mileageAtRefuelKm: number | null;
    readonly tripDistance?: number | null;
    readonly date: Date;
    readonly drivingMode: DrivingMode;

    constructor(params: {
        fuelType: FuelType;
        liters: number;
        totalPrice: number;
        mileageAtRefuelKm: number | null;
        tripDistance?: number | null;
        date: Date;
        drivingMode?: DrivingMode;
    }) {
        if (params.liters <= 0) {
            throw new Error('Fuel liters must be greater than zero');
        }

        if (params.totalPrice <= 0) {
            throw new Error('Total price must be greater than zero');
        }

        if (params.mileageAtRefuelKm !== null && params.mileageAtRefuelKm < 0) {
            throw new Error('Mileage cannot be negative');
        }

        this.fuelType = params.fuelType;
        this.liters = params.liters;
        this.totalPrice = params.totalPrice;
        this.mileageAtRefuelKm = params.mileageAtRefuelKm;
        this.tripDistance = params.tripDistance;
        this.date = params.date;
        this.drivingMode = params.drivingMode ?? DrivingMode.MIXED;
    }

    get pricePerLiter(): number {
        return this.totalPrice / this.liters;
    }
}
