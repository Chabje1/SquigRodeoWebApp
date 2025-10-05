const SKILL_COST_PER_LEVEL = [0, 1, 3, 7];
const ATTRIBUTE_COST_PER_LEVEL = [0, 0, 2, 7, 14, 23, 34, 47, 62];

export class Skill {
    training: number;
    focus: number;

    constructor() {
        this.training = 0;
        this.focus = 0;
    }
}

export class SkillTable {
    [key: string]: Skill;

    arcana: Skill;
    athletics: Skill;
    awareness: Skill;
    ballistic_skill: Skill;
    beast_handling: Skill;
    channelling: Skill;
    crafting: Skill;
    determination: Skill;
    devotion: Skill;
    dexterity: Skill;
    entertain: Skill;
    fortitude: Skill;
    guile: Skill;
    intimidation: Skill;
    intuition: Skill;
    lore: Skill;
    medicine: Skill;
    might: Skill;
    nature: Skill;
    reflexes: Skill;
    stealth: Skill;
    survival: Skill;
    theology: Skill;
    weapon_skill: Skill;

    constructor() {
        this.arcana = new Skill();
        this.athletics = new Skill();
        this.awareness = new Skill();
        this.ballistic_skill = new Skill();
        this.beast_handling = new Skill();
        this.channelling = new Skill();
        this.crafting = new Skill();
        this.determination = new Skill();
        this.devotion = new Skill();
        this.dexterity = new Skill();
        this.entertain = new Skill();
        this.fortitude = new Skill();
        this.guile = new Skill();
        this.intimidation = new Skill();
        this.intuition = new Skill();
        this.lore = new Skill();
        this.medicine = new Skill();
        this.might = new Skill();
        this.nature = new Skill();
        this.reflexes = new Skill();
        this.stealth = new Skill();
        this.survival = new Skill();
        this.theology = new Skill();
        this.weapon_skill = new Skill();
    }
}

export class Attributes {
    [key: string]: number;

    body: number;
    mind: number;
    soul: number;

    constructor() {
        this.body = 1;
        this.mind = 1;
        this.soul = 1;
    }
}

export class Talent {
    name: string;
    cost: number;
    description: string;

    constructor(name: string) {
        this.name = name;
        this.cost = 2;
        this.description = "";
    }
}

export class CharacterSheet {
    name: string;
    total_xp: number;
    skills: SkillTable;
    attributes: Attributes;
    aqua_ghyranis: number;
    remaining_mettle: number;
    armour: number;
    remaining_toughness: number;
    remaining_wounds: number;
    shield_bonus: number;
    short_term_goal: string;
    long_term_goal: string;
    talents: { [name: string]: Talent };
    is_mortally_wounded: boolean;

    constructor(name: string) {
        this.name = name;
        this.total_xp = 35;
        this.skills = new SkillTable();
        this.attributes = new Attributes();
        this.aqua_ghyranis = 200;
        this.remaining_mettle = 0;
        this.armour = 0;
        this.remaining_toughness = 0;
        this.remaining_wounds = 0;
        this.shield_bonus = 0;
        this.short_term_goal = "";
        this.long_term_goal = "";
        this.talents = {};
        this.is_mortally_wounded = false;
    }

    public calculateUsedXp(): number {
        let totalUsed = 0;

        totalUsed += ATTRIBUTE_COST_PER_LEVEL[this.attributes.body];
        totalUsed += ATTRIBUTE_COST_PER_LEVEL[this.attributes.mind];
        totalUsed += ATTRIBUTE_COST_PER_LEVEL[this.attributes.soul];

        for (const skillName in this.skills) {
            totalUsed += SKILL_COST_PER_LEVEL[this.skills[skillName].training];
            totalUsed += SKILL_COST_PER_LEVEL[this.skills[skillName].focus];
        }

        for (const talent in this.talents) {
            totalUsed += this.talents[talent].cost;
        }

        return totalUsed;
    }

    public getTotalToughness(): number {
        return this.attributes.body + this.attributes.mind + this.attributes.soul;
    }

    public getTotalWounds(): number {
        return Math.ceil((this.attributes.body + this.attributes.mind + this.attributes.soul) / 2);
    }

    public getTotalMettle(): number {
        return Math.ceil(this.attributes.soul / 2);
    }

    public getInitiative(): number {
        return this.attributes.mind + this.skills.reflexes.training + this.skills.awareness.training;
    }

    public getNaturalAwareness(): number {
        return Math.ceil((this.attributes.mind + this.skills.awareness.training) / 2);
    }

    public getMelee(): number {
        return Math.floor((this.attributes.body + this.skills.weapon_skill.training - 1) / 2);
    }

    public getAccuracy(): number {
        return Math.floor((this.attributes.mind + this.skills.ballistic_skill.training - 1) / 2);
    }

    public getDefence(): number {
        return Math.floor((this.attributes.body + this.skills.reflexes.training - 1) / 2) + this.shield_bonus;
    }

    public getMeleeText(): string {
        return MAD_TEXT[this.getMelee()];
    }

    public getAccuracyText(): string {
        return MAD_TEXT[this.getAccuracy()];
    }

    public getDefenceText(): string {
        return MAD_TEXT[this.getDefence()];
    }
}

export const MAD_TEXT: Array<string> = [
    "Poor",
    "Average",
    "Good",
    "Great",
    "Superb",
    "Extraordinary",
];