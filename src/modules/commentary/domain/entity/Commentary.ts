export class Commentary {
  constructor(
    public readonly id: string,
    public readonly text: string,
    public readonly featureKeys: string[],
    public readonly tags: string[],
    public readonly commentatorId: string,
    public readonly enabled: boolean
  ) {}
}
