import { Feature } from "../domain/entity/Feature";

export class FeatureMapper {
    static fromPrisma(app: any): Feature {
        return new Feature(
            app.id,
            app.key,
            app.name,
            app.description,
            app.icon,
            app.route,
            app.enabled,
            app.order
        );
    }
}
