import { Car } from "../../domain/entity/Car";
import { CarResponseDto } from "../dto/GetCarResponseDto";

export class CarHttpMapper {
    static toResponse(car: Car): CarResponseDto {
        return new CarResponseDto(
            car.id,
            car.name,
            car.soldAt,
        );
    }

    static toResponseList(car: Car[]): CarResponseDto[] {
        return car.map(this.toResponse);
    }
}
