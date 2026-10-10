export interface ReminderContext {
    exists: boolean;
    active: boolean;
    currentMileageKm: number | null;
    mileageRecordedAt: Date | null;
    mileageSource: 'READING' | 'PURCHASE' | null;
}

export interface ReminderContextProvider {
    getContext(resourceId: string | null): Promise<ReminderContext>;
}
