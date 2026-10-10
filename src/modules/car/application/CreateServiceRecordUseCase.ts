import { ServiceRecord } from '../domain/entity/ServiceRecord';
import { CarRepository } from '../domain/repository/CarRepository';
import { ServiceRecordRepository } from '../domain/repository/ServiceRecordRepository';

export interface CreateServiceRecordInput {
    description: string;
    cost: number;
    mileageKm: number;
    date: string;
    isOilChange?: boolean;
}

export class CreateServiceRecordUseCase {
    constructor(
        private readonly carRepository: CarRepository,
        private readonly serviceRecordRepository: ServiceRecordRepository
    ) {}

    async execute(carId: string, input: CreateServiceRecordInput): Promise<boolean> {
        const car = await this.carRepository.findById(carId);
        if (!car) return false;

        const record = new ServiceRecord({
            description: input.description,
            cost: Number(input.cost),
            mileageKm: Number(input.mileageKm),
            date: new Date(input.date),
            isOilChange: input.isOilChange
        });

        await this.serviceRecordRepository.create(carId, record);
        return true;
    }
}
