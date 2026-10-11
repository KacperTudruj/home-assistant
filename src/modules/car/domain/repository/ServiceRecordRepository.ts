import { ServiceLabel } from '../value-object/ServiceLabel';
import { ServiceRecord } from '../entity/ServiceRecord';

export interface StoredServiceRecord {
    id: string;
    carId: string;
    description: string;
    cost: number;
    mileageKm: number;
    date: Date;
    label: ServiceLabel | null;
    workshopName: string | null;
    workshopAddress: string | null;
}

export interface ServiceRecordRepository {
    create(carId: string, record: ServiceRecord): Promise<void>;
    findByCarId(carId: string): Promise<StoredServiceRecord[]>;
}
