export class FeatureNarrator {
  constructor(
    public readonly featureKey: string,
    public readonly commentatorId: string,
    public readonly priority: number
  ) {}
}
