import { SmartHomeProvider, SmartHomeDevice } from "../domain/SmartHomeDevice";

export class GetSmartHomeDevicesUseCase {
    constructor(private readonly provider: SmartHomeProvider) {}

    async execute(): Promise<SmartHomeDevice[]> {
        return this.provider.getDevices();
    }
}
