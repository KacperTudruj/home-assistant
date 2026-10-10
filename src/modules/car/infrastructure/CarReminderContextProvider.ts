import { CarRepository } from '../domain/repository/CarRepository';
import { ReminderContext, ReminderContextProvider } from '../../reminders/domain/ReminderContextProvider';

export class CarReminderContextProvider implements ReminderContextProvider {
    constructor(private readonly cars: CarRepository) {}

    async getContext(resourceId: string | null): Promise<ReminderContext> {
        const empty: ReminderContext = {
            exists: true, active: true, currentMileageKm: null, mileageRecordedAt: null, mileageSource: null
        };
        if (!resourceId) return empty;
        const car = await this.cars.findById(resourceId);
        if (!car) return { ...empty, exists: false, active: false };
        const reading = car.getLatestMileage();
        // A default purchase mileage of zero does not establish a reliable baseline.
        const purchase = car.mileageAtPurchase && car.mileageAtPurchase > 0 ? car.mileageAtPurchase : null;
        return {
            exists: true,
            active: car.isActive,
            currentMileageKm: reading?.mileageKm ?? purchase,
            mileageRecordedAt: reading?.date ?? null,
            mileageSource: reading ? 'READING' : purchase !== null ? 'PURCHASE' : null
        };
    }
}
