import { SmartHomeProvider } from "../domain/SmartHomeDevice";

export class UpdateCameraLabelUseCase {
    constructor(private readonly provider: SmartHomeProvider) {}

    async execute(id: string, label: string): Promise<void> {
        if (!this.provider.updateCameraLabel) {
            throw new Error("Provider does not support updating camera label");
        }
        return this.provider.updateCameraLabel(id, label);
    }
}
