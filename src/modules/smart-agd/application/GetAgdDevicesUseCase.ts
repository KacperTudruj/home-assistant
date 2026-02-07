import { AgdProvider } from '../domain/AgdProvider';
import { AgdDevice } from '../domain/AgdDevice';

export class GetAgdDevicesUseCase {
    constructor(private readonly agdProvider: AgdProvider) {}

    async execute(): Promise<AgdDevice[]> {
        return this.agdProvider.getAgdDevices();
    }
}
