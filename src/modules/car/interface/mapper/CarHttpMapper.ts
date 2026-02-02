import { Car } from "../../domain/entity/Car";
import { ItemGetCarResponseDto } from "../dto/ItemGetCarResponseDto";
import { GetCarResponse } from "../dto/GetCarResponse";
import { MileageSummaryDto } from "../dto/MileageSummary";

export class CarHttpMapper {
    static toResponse(car: Car): GetCarResponse {
        const latestMileage = car.getLatestMileage()?.mileageKm || 0;
        const purchaseMileage = 0; // TODO: Implement this properly later

        const mileageSummary = new MileageSummaryDto();
        mileageSummary.atPurchase = purchaseMileage;
        mileageSummary.current = latestMileage;
        // Calculation moved to frontend for now to avoid inconsistencies, 
        // but we can also set it here if we want it to be part of the API contract.
        mileageSummary.ownedDistance = latestMileage > 0 ? (latestMileage - purchaseMileage) : 0;

        return new GetCarResponse(
            car.id,
            car.name,
            car.year,
            car.isActive,
            car.soldAt || null,
            mileageSummary,
            car.engine || null,
            car.vin || null
        );
    }

    static toResponseList(car: Car[]): ItemGetCarResponseDto[] {
        return car.map(c => new ItemGetCarResponseDto(
            c.id,
            c.name,
            c.year,
            c.isActive,
            c.soldAt
        ));
    }
}
