export class Attack {
    name: string;
    damage: number;
    is_ranged: boolean;
    focus: number;

    constructor(name: string) {
        this.name = name;
        this.damage = 0;
        this.is_ranged = false;
        this.focus = 0;
    }
};

export class MonsterSheet {
    name: string;
    size: string;
    species: string;
    type: string;

    total_mettle: number;
    total_toughness: number;
    total_wounds: number;

    remaining_mettle: number;
    remaining_toughness: number;
    remaining_wounds: number;

    armour: number;
    initiative: number;

    melee: number;
    accuracy: number;
    defence: number;

    attacks: { [name: string]: Attack };

    constructor(name: string) {
        this.name = name;
        this.size = "";
        this.species = "";
        this.type = "";
        this.remaining_mettle = 0;
        this.remaining_toughness = 0;
        this.remaining_wounds = 0;
        this.total_mettle = 0;
        this.total_toughness = 0;
        this.total_wounds = 0;
        this.armour = 0;
        this.initiative = 0;
        this.melee = 0;
        this.accuracy = 0;
        this.defence = 0;
        this.attacks = {};
    }
};