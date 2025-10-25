import { MonsterSheet } from "./MonsterSheet";

// Initiative
export class InitiativeEntry {
    initiative_value: number;
    entity: string | MonsterSheet;

    constructor(initiative_value: number, entity: string | MonsterSheet) {
        this.initiative_value = initiative_value;
        this.entity = entity;
    }

    public getName(): string {
        if (this.entity instanceof MonsterSheet) {
            return (this.entity as MonsterSheet).name;
        }
        else {
            return this.entity;
        }
    }
}

export function compareEntries(lhs: InitiativeEntry, rhs: InitiativeEntry) {
    return rhs.initiative_value - lhs.initiative_value;
}

export class InitiativeUpdate {
    uid: string;
    value: InitiativeEntry | null;

    constructor(uid: string, value: InitiativeEntry | null) {
        this.uid = uid;
        this.value = value;
    }
}