export class Commentator {
  constructor(
    public readonly id: string,
    public readonly key: string,   // "henryk", "system"
    public readonly name: string,  // "Jamnik Henryk"
    public readonly style: string, // "humorous", "serious"
    public readonly enabled: boolean
  ) {}
}
