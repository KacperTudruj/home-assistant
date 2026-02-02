import { Car } from "../../domain/entity/Car";
import { ItemGetCarResponseDto } from "../dto/ItemGetCarResponseDto";

export class CarHttpMapper {
    static toResponse(car: Car): ItemGetCarResponseDto {
        return new ItemGetCarResponseDto(
            car.id,
            car.name,
            car.year,
            car.isActive,
            car.soldAt,
        );
    }

    static toResponseList(car: Car[]): ItemGetCarResponseDto[] {
        return car.map(this.toResponse);
    }
}
