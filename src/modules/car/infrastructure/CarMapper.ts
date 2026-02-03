import { Car } from "../domain/entity/Car";

export class CarMapper {
    static fromPrisma(car: any): Car {
        return new Car({
            id: car.id,
            name: car.name,
            year: car.year,
            isActive: car.isActive,
            soldAt: car.soldAt,
            engine: car.engine,
            vin: car.vin,
            mileageAtPurchase: car.mileageAtPurchase,
        });
    }
}