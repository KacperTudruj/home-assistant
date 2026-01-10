import { FuelType } from '../value-object/FuelType';

export class FuelRecord {
    readonly fuelType: FuelType;
    readonly liters: number;
    readonly totalPrice: number;
    readonly mileageAtRefuelKm: number;
    readonly date: Date;

    constructor(params: {
        fuelType: FuelType;
        liters: number;
        totalPrice: number;
        mileageAtRefuelKm: number;
        date: Date;
    }) {
        if (params.liters <= 0) {
            throw new Error('Fuel liters must be greater than zero');
        }

        if (params.totalPrice <= 0) {
            throw new Error('Total price must be greater than zero');
        }

        if (params.mileageAtRefuelKm < 0) {
            throw new Error('Mileage cannot be negative');
        }

        this.fuelType = params.fuelType;
        this.liters = params.liters;
        this.totalPrice = params.totalPrice;
        this.mileageAtRefuelKm = params.mileageAtRefuelKm;
        this.date = params.date;
    }

    get pricePerLiter(): number {
        return this.totalPrice / this.liters;
    }
}
