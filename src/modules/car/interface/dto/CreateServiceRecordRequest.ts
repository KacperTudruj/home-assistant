import { ServiceLabel } from '../../domain/value-object/ServiceLabel';
export interface CreateServiceRecordRequest {
    description: string;
    cost: number;
    mileageKm: number;
    date: string;
    label?: ServiceLabel | null;
    workshopName?: string | null;
    workshopAddress?: string | null;
}
