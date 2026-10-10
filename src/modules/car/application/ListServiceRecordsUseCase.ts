import { ServiceRecordRepository, StoredServiceRecord } from '../domain/repository/ServiceRecordRepository';

export class ListServiceRecordsUseCase {
    constructor(private readonly serviceRecordRepository: ServiceRecordRepository) {}

    async execute(carId: string): Promise<StoredServiceRecord[]> {
        return this.serviceRecordRepository.findByCarId(carId);
    }
}
