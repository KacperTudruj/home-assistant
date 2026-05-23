import { AgdProvider } from './AgdProvider';
import { AgdDevice } from './AgdDevice';

export class CompositeAgdProvider implements AgdProvider {
    constructor(private readonly providers: AgdProvider[]) {}

    async getAgdDevices(): Promise<AgdDevice[]> {
        const allDevices = await Promise.all(
            this.providers.map(p => p.getAgdDevices())
        );
        return allDevices.flat();
    }
}
