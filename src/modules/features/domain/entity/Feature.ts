export class Feature {
  constructor(
    public readonly id: string,
    public readonly key: string,
    public readonly name: string,
    public readonly description: string,
    public readonly icon: string,
    public readonly route: string,
    public readonly enabled: boolean,
    public readonly order: number,
  ) {}
}