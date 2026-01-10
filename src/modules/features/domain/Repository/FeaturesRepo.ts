import { Feature } from "../entity/Feature";

export interface FeaturesRepo {
    listAll(): Promise<Feature[]>;
}