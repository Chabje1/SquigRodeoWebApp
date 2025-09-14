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
    [key: string]: Skill | (() => number);

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

    public getUsedXp(): number {
        let totalUsed = 0;

        totalUsed += SKILL_COST_PER_LEVEL[this.arcana.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.arcana.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.athletics.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.athletics.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.awareness.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.awareness.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.ballistic_skill.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.ballistic_skill.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.beast_handling.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.beast_handling.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.channelling.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.channelling.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.crafting.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.crafting.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.determination.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.determination.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.devotion.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.devotion.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.dexterity.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.dexterity.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.entertain.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.entertain.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.fortitude.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.fortitude.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.guile.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.guile.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.intimidation.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.intimidation.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.intuition.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.intuition.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.lore.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.lore.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.medicine.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.medicine.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.might.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.might.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.nature.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.nature.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.reflexes.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.reflexes.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.stealth.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.stealth.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.survival.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.survival.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.theology.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.theology.focus];
        totalUsed += SKILL_COST_PER_LEVEL[this.weapon_skill.training];
        totalUsed += SKILL_COST_PER_LEVEL[this.weapon_skill.focus];

        return totalUsed;
    }
}

export class Attributes {
    [key: string]: number | (() => number);

    body: number;
    mind: number;
    soul: number;

    constructor() {
        this.body = 1;
        this.mind = 1;
        this.soul = 1;
    }

    public getUsedXp(): number {
        let totalUsed = 0;

        totalUsed += ATTRIBUTE_COST_PER_LEVEL[this.body];
        totalUsed += ATTRIBUTE_COST_PER_LEVEL[this.mind];
        totalUsed += ATTRIBUTE_COST_PER_LEVEL[this.soul];

        return totalUsed;
    }
}

export class CharacterSheet {
    name: string;
    remaining_xp: number;
    total_xp: number;
    skills: SkillTable;
    attributes: Attributes;
    aqua_ghyranis: number;
    remaining_mettle: number;
    armour: number;
    remaining_toughness: number;
    remaining_wounds: number;
    has_shield: boolean;
    short_term_goal: string;
    long_term_goal: string;

    constructor(name: string) {
        this.name = name;
        this.remaining_xp = 35;
        this.total_xp = 35;
        this.skills = new SkillTable();
        this.attributes = new Attributes();
        this.aqua_ghyranis = 200;
        this.remaining_mettle = 0;
        this.armour = 0;
        this.remaining_toughness = 0;
        this.remaining_wounds = 0;
        this.has_shield = false;
        this.short_term_goal = ""
        this.long_term_goal = ""
    }

    public calculateUsedXp(): number {
        let totalUsed = 0;

        totalUsed += this.attributes.getUsedXp();
        totalUsed += this.skills.getUsedXp();

        return totalUsed;
    }
}