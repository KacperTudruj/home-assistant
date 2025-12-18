import { FeatureNarrator } from "./entity/FeatureNarrator";

export interface FeatureNarratorRepository {
  getForFeature(featureKey: string): Promise<FeatureNarrator | null>;
}
