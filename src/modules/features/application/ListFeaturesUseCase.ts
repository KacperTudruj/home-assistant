import { Feature } from "../domain/entity/Feature";
import { FeaturesRepo } from "../domain/Repository/FeaturesRepo";


export class ListFeaturesUseCase {
    constructor(
        private readonly featuresRepo: FeaturesRepo
    ) { }
    async execute(): Promise<Feature[]> {
        return await this.featuresRepo.listAll();;
    }
}