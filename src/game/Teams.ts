export class TeamWrapper {
    public score = 0;

    constructor(public readonly team: mod.Team) {}

    public equals(other: mod.Team): boolean {
        return mod.GetObjId(this.team) === mod.GetObjId(other);
    }
}
