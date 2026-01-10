import { Feature } from "../../domain/entity/Feature";
import { FeatureResponseDto } from "../dto/FeatureResponseDto";

export class FeatureHttpMapper {
    static toResponse(feature: Feature): FeatureResponseDto {
        return new FeatureResponseDto(
            feature.id,
            feature.key,
            feature.name,
            feature.description,
            feature.icon,
            feature.route,
            feature.enabled,
            feature.order
        );
    }

    static toResponseList(features: Feature[]): FeatureResponseDto[] {
        return features.map(this.toResponse);
    }
}
