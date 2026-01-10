import { Feature } from "../domain/entity/Feature";
import { FeaturesRepo } from "../domain/Repository/FeaturesRepo";

export class FeaturesRepositoryPrisma implements FeaturesRepo {
    listAll(): Promise<Feature[]> {
        throw new Error("Method not implemented.");
    }
}