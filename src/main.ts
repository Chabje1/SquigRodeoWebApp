import { CharacterSheet, SkillTable, Skill, Talent, MAD_TEXT } from "./CharacterSheet";
import { MonsterSheet, Attack } from "./MonsterSheet";
import { toTitleCase } from "./utilities";
import { InitiativeEntry, InitiativeUpdate, compareEntries } from "./Initiative";

import { faker } from "@faker-js/faker";
import OBR from "@owlbear-rodeo/sdk";

// ------------- Editor Global States -------------

// Active Entity Sheet
let currentlyPlayedEntity = "";
let currentlyPlayedEntityType = "";

// Character Editor
let globalCharacterDictionary = new Map<string, CharacterSheet>();
let selectedCharacterName: string = "";

// Monster Editor
let globalMonsterDictionary = new Map<string, MonsterSheet>();
let selectedMonsterName = "";

// Dice Roller
let numDice: number = 0;
let currentUserName: string = "Stellia";

// Skill Roller
let rollerSelectedAttribute = "body";
let rollerSelectedSkill = "arcana";

// Active Talents
let selectedTalentName = "";

// Initiative
let initiativeMap = new Map<string, InitiativeEntry>();
let initiativeIndex = 0;
let initiativeUid = "";

// ------------- Logic -------------
// Menu Navigation Button Logic
function homeButtonClick() {
   document.querySelector<HTMLDivElement>('#home_screen')!.classList.remove("hidden");
   document.querySelector<HTMLDivElement>('#character_screen')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#bestiary_screen')!.classList.add("hidden");

   updatePlayedCharacterSheet();
}

function charactersButtonClick() {
   document.querySelector<HTMLDivElement>('#home_screen')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#character_screen')!.classList.remove("hidden");
   document.querySelector<HTMLDivElement>('#bestiary_screen')!.classList.add("hidden");

   if (selectedCharacterName != "") {
      setActiveEditCharacter(selectedCharacterName)
   }
}

function bestiaryButtonClick() {
   document.querySelector<HTMLDivElement>('#home_screen')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#character_screen')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#bestiary_screen')!.classList.remove("hidden");

   if (selectedMonsterName != "") {
      setSelectedMonster(selectedMonsterName);
   }
}

document.querySelector<HTMLButtonElement>("#home_button")!.addEventListener("click", homeButtonClick)
document.querySelector<HTMLButtonElement>("#characters_button")!.addEventListener("click", charactersButtonClick)
document.querySelector<HTMLButtonElement>("#bestiary_button")!.addEventListener("click", bestiaryButtonClick)

function logMessageToChat(msg: string) {
   let message: HTMLParagraphElement = document.createElement("p")

   message.classList.add("text-sm", "not-last:border-b-1");

   message.innerText = msg;

   let chatWindow = document.querySelector<HTMLDivElement>("#chatWindow")!;

   chatWindow.appendChild(message);
   chatWindow.scrollTo(0, chatWindow.scrollHeight);
}

function sendMessageToChat(msg: string) {
   logMessageToChat(msg);

   broadcastMessage(msg);
}


// Dice Button Logic
function increaseDiceNum() {
   numDice += 1
   document.querySelector<HTMLDivElement>("#numDiceView")!.textContent = numDice.toString();
}

function decreaseDiceNum() {
   if (numDice > 0) {
      numDice -= 1
      document.querySelector<HTMLDivElement>("#numDiceView")!.textContent = numDice.toString();
   }
}

function rollD6(): number {
   return Math.floor(Math.random() * 6) + 1;
}

function rollND6(N: number): Uint8Array {
   let results = new Uint8Array(N);
   for (let i = 0; i < N; i++) {
      results[i] = rollD6();
   }
   return results
}

function rollDiceAction() {
   let rollResults = rollND6(numDice);
   let dn = document.querySelector<HTMLInputElement>("#diffNumHolder")!.valueAsNumber;

   let message = currentUserName + " has rolled " + rollResults.toString();

   if (dn != 0) {
      let numberOfSuccesses = rollResults.filter((value) => { return value >= dn; }).length;

      message += " = " + numberOfSuccesses.toString() + " successes."
   }

   sendMessageToChat(message);
}

document.querySelector<HTMLButtonElement>("#numDiceIncreaseButton")!.addEventListener("click", increaseDiceNum)
document.querySelector<HTMLButtonElement>("#numDiceDecreaseButton")!.addEventListener("click", decreaseDiceNum)
document.querySelector<HTMLButtonElement>("#rollDiceButton")!.addEventListener("click", rollDiceAction)

// Character List
function setActiveEditCharacter(charName: string) {
   selectedCharacterName = charName;

   document.querySelector<HTMLDivElement>("#edit_character_sheet")!.classList.remove("hidden");
   document.querySelector<HTMLButtonElement>("#export_character")!.classList.remove("hidden");

   if (charName != currentlyPlayedEntity) {
      document.querySelector<HTMLButtonElement>("#play_character")!.classList.remove("hidden");
   }
   else {
      document.querySelector<HTMLButtonElement>("#play_character")!.classList.add("hidden");
   }

   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   document.querySelector<HTMLInputElement>("#character_name_input")!.value = charName;

   // XP
   updateRemainingXp();
   document.querySelector<HTMLInputElement>("#total_xp_input")!.valueAsNumber = selectedCharacter.total_xp;

   // Skills
   for (const skillName in selectedCharacter.skills) {
      displaySkillValue("training", skillName, (selectedCharacter.skills[skillName] as Skill).training);
      displaySkillValue("focus", skillName, (selectedCharacter.skills[skillName] as Skill).focus);
   }

   // Attributes
   document.querySelector<HTMLInputElement>("#body_input_field")!.value = selectedCharacter.attributes.body.toString();
   document.querySelector<HTMLInputElement>("#mind_input_field")!.value = selectedCharacter.attributes.mind.toString();
   document.querySelector<HTMLInputElement>("#soul_input_field")!.value = selectedCharacter.attributes.soul.toString();

   // Aqua Ghyranis
   document.querySelector<HTMLInputElement>("#aqua_hyranis_editor")!.value = selectedCharacter.aqua_ghyranis.toString();

   // Implicit Stats
   updateTotalToughness();
   updateTotalMettle();
   updateTotalWounds();
   updateCharacterInitiative();
   updateCharacterNaturalAwareness();

   // Combat Stats
   updateCharacterMelee();
   updateCharacterAccuracy();
   updateCharacterDefence();

   // Remainings
   document.querySelector<HTMLInputElement>("#remaining_mettle_input")!.value = selectedCharacter.remaining_mettle.toString();
   document.querySelector<HTMLInputElement>("#remaining_toughness_input")!.value = selectedCharacter.remaining_toughness.toString();
   document.querySelector<HTMLInputElement>("#remaining_wounds_input")!.value = selectedCharacter.remaining_wounds.toString();

   // Armour & Shield
   document.querySelector<HTMLInputElement>("#armour_input")!.value = selectedCharacter.armour.toString();

   document.querySelector<HTMLInputElement>("#has_shield_toggle")!.checked = (selectedCharacter.shield_bonus == 1);

   // Goals
   document.querySelector<HTMLTextAreaElement>("#character_editor_stg_input")!.value = selectedCharacter.short_term_goal;
   document.querySelector<HTMLTextAreaElement>("#character_editor_ltg_input")!.value = selectedCharacter.long_term_goal;

   // Talents
   document.querySelector<HTMLDivElement>("#talent_editor_panel")!.classList.add("hidden");
   selectedTalentName = ""

   let talent_list = document.querySelector<HTMLSelectElement>("#editor_talent_list_dropdown")!;

   while (talent_list.lastChild) {
      talent_list.removeChild(talent_list.lastChild);
   }

   for (const talent in selectedCharacter.talents) {
      let newOption: HTMLOptionElement = document.createElement("option");
      newOption.value = selectedCharacter.talents[talent].name;
      newOption.innerText = selectedCharacter.talents[talent].name;
      talent_list.appendChild(newOption);
   }

   talent_list.value = "";
}

function onCharacterSelected(this: HTMLSelectElement) {
   setActiveEditCharacter(this.value);
}

function handleNewCharacter(name: string) {
   let newOption: HTMLOptionElement = document.createElement("option");

   // Character Dropdown
   newOption.value = name;
   newOption.innerText = name;

   let character_list = document.querySelector<HTMLSelectElement>("#character_list_dropdown")!;

   character_list.appendChild(newOption);
   character_list.value = name;

   // Activate Character
   setActiveEditCharacter(name);
}

function playCharacter() {
   currentlyPlayedEntity = selectedCharacterName.slice(0);
   currentlyPlayedEntityType = "Player";
   document.querySelector<HTMLButtonElement>("#play_character")!.classList.add("hidden");
}

document.querySelector<HTMLButtonElement>("#play_character")!.addEventListener("click", playCharacter);


function createCharacterButtonClick() {

   let name = prompt("Character Name")!;

   while (globalCharacterDictionary.has(name)) {
      alert("Error: Character already exists.");
      name = prompt("Character Name")!;
   }

   // Character List Update
   globalCharacterDictionary.set(name, new CharacterSheet(name));

   handleNewCharacter(name);
}

function deleteCharacter() {
   globalCharacterDictionary.delete(selectedCharacterName);

   let character_list = document.querySelector<HTMLSelectElement>("#character_list_dropdown")!;

   let selectedOptions = character_list.selectedOptions;

   for (let index = 0; index < selectedOptions.length; index++) {
      character_list.removeChild(selectedOptions[index]);
   }

   if (character_list.childElementCount > 0) {
      let newSelected = character_list.options[0];

      character_list.value = newSelected.value;
      setActiveEditCharacter(newSelected.value);
   }
   else {
      selectedCharacterName = "";
      character_list.value = "";
      document.querySelector<HTMLDivElement>("#edit_character_sheet")!.classList.add("hidden");
      document.querySelector<HTMLButtonElement>("#export_character")!.classList.add("hidden");
      document.querySelector<HTMLButtonElement>("#play_character")!.classList.add("hidden");
   }
}

document.querySelector<HTMLSelectElement>("#character_list_dropdown")!.addEventListener("change", onCharacterSelected)
document.querySelector<HTMLButtonElement>("#add_character")!.addEventListener("click", createCharacterButtonClick)
document.querySelector<HTMLButtonElement>("#remove_character")!.addEventListener("click", deleteCharacter)

function updateTotalToughness() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   document.querySelector<HTMLDivElement>("#editor_total_toughness_display")!.innerText = selectedCharacter.getTotalToughness().toString();
}

function updateTotalMettle() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   document.querySelector<HTMLDivElement>("#editor_total_mettle_display")!.innerText = selectedCharacter.getTotalMettle().toString();
}

function updateTotalWounds() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   document.querySelector<HTMLDivElement>("#editor_total_wounds_display")!.innerText = selectedCharacter.getTotalWounds().toString();
}

function updateCharacterInitiative() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   document.querySelector<HTMLDivElement>("#initiative_display")!.innerText = selectedCharacter.getInitiative().toString();
}

function updateCharacterNaturalAwareness() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   document.querySelector<HTMLDivElement>("#natural_awareness_display")!.innerText = selectedCharacter.getNaturalAwareness().toString();
}

function updateCharacterMelee() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   for (let index = 0; index < 6; index++) {
      document.querySelector<HTMLDivElement>("#character_melee_" + index.toString())!.classList.remove("bg-gray-500");
   }

   document.querySelector<HTMLDivElement>("#character_melee_" + selectedCharacter.getMelee().toString())!.classList.add("bg-gray-500");
}

function updateCharacterAccuracy() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   for (let index = 0; index < 6; index++) {
      document.querySelector<HTMLDivElement>("#character_accuracy_" + index.toString())!.classList.remove("bg-gray-500");
   }

   document.querySelector<HTMLDivElement>("#character_accuracy_" + selectedCharacter.getAccuracy().toString())!.classList.add("bg-gray-500");
}

function updateCharacterDefence() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   for (let index = 0; index < 6; index++) {
      document.querySelector<HTMLDivElement>("#character_defence_" + index.toString())!.classList.remove("bg-gray-500");
   }

   document.querySelector<HTMLDivElement>("#character_defence_" + selectedCharacter.getDefence().toString())!.classList.add("bg-gray-500");
}

function updateRemainingXp() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   let remaining_xp = selectedCharacter.total_xp - selectedCharacter.calculateUsedXp();

   document.querySelector<HTMLLabelElement>("#remaining_xp_text")!.innerText = remaining_xp.toString();
}

function totalXpInputEvent(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.total_xp = this.valueAsNumber;

   updateRemainingXp();
}

document.querySelector<HTMLInputElement>("#total_xp_input")!.addEventListener("input", totalXpInputEvent);

// Character Editor Skill Table
function displaySkillValue(valueType: string, name: string, level: number) {
   for (let index = 1; index <= 3; index++) {
      let displayButton = document.querySelector<HTMLButtonElement>("#set_" + name + "_" + valueType + "_to_" + index.toString())!;

      if (index <= level) {
         displayButton.classList.remove("bg-white");
         displayButton.classList.add("bg-gray");
      }
      else {
         displayButton.classList.remove("bg-gray");
         displayButton.classList.add("bg-white");
      }
   }
}

function setCharacterSkillTraining(name: string, level: number) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   if ((selectedCharacter.skills[name] as Skill).training == level) {
      level = 0;
   }

   (selectedCharacter.skills[name] as Skill).training = level;

   displaySkillValue("training", name, level);

   updateRemainingXp();

   updateCharacterInitiative();
   updateCharacterNaturalAwareness();

   updateCharacterMelee();
   updateCharacterDefence();
   updateCharacterAccuracy();
}

function setCharacterSkillFocus(name: string, level: number) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   if ((selectedCharacter.skills[name] as Skill).focus == level) {
      level = 0;
   }

   (selectedCharacter.skills[name] as Skill).focus = level;

   displaySkillValue("focus", name, level);

   updateRemainingXp();
}

function setupEditorSkillTable() {
   let placeHolderSkillTable = new SkillTable();

   let skillTableNameColumn = document.querySelector<HTMLDivElement>("#skill_table_name_column")!;
   let skillTableTrainingColumn = document.querySelector<HTMLDivElement>("#skill_table_training_column")!;
   let skillTableFocusColumn = document.querySelector<HTMLDivElement>("#skill_table_focus_column")!;

   for (const skillName in placeHolderSkillTable) {

      if (placeHolderSkillTable[skillName] instanceof Skill) {

         // Add skill names
         let textElement = document.createElement("p");
         textElement.classList.add("font-bold", "text-sm", "text-center");

         textElement.textContent = toTitleCase(skillName.replace("_", " "));

         skillTableNameColumn.appendChild(textElement);

         // Add skill training buttons
         let trainingDiv = document.createElement("div");
         trainingDiv.classList.add("flex", "flex-row", "gap-5");

         for (let index = 1; index <= 3; index++) {
            let trainingButton = document.createElement("button");

            trainingButton.id = "set_" + skillName + "_training_to_" + index.toString();

            trainingButton.classList.add("size-5", "border-1", "border-black", "bg-white");

            trainingButton.addEventListener("click", () => { setCharacterSkillTraining(skillName, index); });

            trainingDiv.appendChild(trainingButton);
         }

         skillTableTrainingColumn.appendChild(trainingDiv);

         // Add skill focus buttons
         let focusDiv = document.createElement("div");
         focusDiv.classList.add("flex", "flex-row", "gap-5");

         for (let index = 1; index <= 3; index++) {
            let focusButton = document.createElement("button");

            focusButton.id = "set_" + skillName + "_focus_to_" + index.toString();

            focusButton.classList.add("size-5", "border-1", "border-black", "bg-white");

            focusButton.addEventListener("click", () => { setCharacterSkillFocus(skillName, index); });

            focusDiv.appendChild(focusButton);
         }

         skillTableFocusColumn.appendChild(focusDiv);
      }
   }
}

setupEditorSkillTable()

// Skill Roller
function skillRollerAttributeSelect(this: HTMLSelectElement) {
   rollerSelectedAttribute = this.value;
}
document.querySelector<HTMLSelectElement>("#active_character_attribute_dropdown")!.addEventListener("change", skillRollerAttributeSelect)

function skillRollerSkillSelect(this: HTMLSelectElement) {
   rollerSelectedSkill = this.value;
}
document.querySelector<HTMLSelectElement>("#active_character_skill_dropdown")!.addEventListener("change", skillRollerSkillSelect)


function setupSkillRoller() {
   let placeHolderSkillTable = new SkillTable();

   let skillRollerDropdown = document.querySelector<HTMLSelectElement>("#active_character_skill_dropdown")!;

   for (const skillName in placeHolderSkillTable) {

      if (placeHolderSkillTable[skillName] instanceof Skill) {

         // Add skill names
         let optionElement = document.createElement("option");

         optionElement.value = skillName;
         optionElement.innerText = toTitleCase(skillName.replace("_", " "));

         skillRollerDropdown.appendChild(optionElement);
      }
   }
}

setupSkillRoller()

function rollSkillButtonClick() {
   if (rollerSelectedAttribute == "" || rollerSelectedSkill == "") {
      return;
   }

   let selectedCharacter = globalCharacterDictionary.get(currentlyPlayedEntity)!

   let diceNumber: number = selectedCharacter.attributes[rollerSelectedAttribute] + selectedCharacter.skills[rollerSelectedSkill].training;


   let rollResults = rollND6(diceNumber);
   let dn = document.querySelector<HTMLInputElement>("#diffNumHolder")!.valueAsNumber;

   let message = `${currentUserName} has rolled ${toTitleCase(rollerSelectedAttribute.replace("_", " "))}<${toTitleCase(rollerSelectedSkill.replace("_", " "))}>: ${rollResults}`;

   if (dn != 0) {
      let numberOfSuccesses = rollResults.filter((value) => { return value >= dn; }).length;

      message += " = " + numberOfSuccesses.toString() + "S."
   }

   sendMessageToChat(message);
}

document.querySelector<HTMLButtonElement>("#roll_skill_button")!.addEventListener("click", rollSkillButtonClick)


// Character Name
function setCharacterName(this: HTMLInputElement): boolean {
   if (globalCharacterDictionary.get(this.value) !== undefined) {
      alert("Error: Character already exists.");
      return false;
   }

   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.name = this.value;

   globalCharacterDictionary.delete(selectedCharacterName)!;
   globalCharacterDictionary.set(selectedCharacter.name, selectedCharacter);


   let character_list = document.querySelector<HTMLSelectElement>("#character_list_dropdown")!;

   for (var optionChild of character_list.children) {
      if ((optionChild as HTMLOptionElement).value == selectedCharacterName) {
         (optionChild as HTMLOptionElement).value = selectedCharacter.name;
         (optionChild as HTMLOptionElement).innerText = selectedCharacter.name;
         break;
      }
   }

   selectedCharacterName = selectedCharacter.name;
   character_list.value = selectedCharacterName;

   return true;
}
document.querySelector<HTMLInputElement>("#character_name_input")!.addEventListener("input", setCharacterName);

// Attributes
function setAttributeValue(name: string, value: number) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.attributes[name] = value;

   updateRemainingXp();
}

function setBodyValue(this: HTMLInputElement) {
   setAttributeValue("body", +this.value);

   updateTotalToughness();
   updateTotalWounds();

   updateCharacterMelee();
   updateCharacterDefence();
}

function setMindValue(this: HTMLInputElement) {
   setAttributeValue("mind", +this.value);

   updateTotalToughness();
   updateTotalWounds();
   updateCharacterInitiative();
   updateCharacterNaturalAwareness();

   updateCharacterAccuracy();
}

function setSoulValue(this: HTMLInputElement) {
   setAttributeValue("soul", +this.value);

   updateTotalToughness();
   updateTotalMettle();
   updateTotalWounds();
}

document.querySelector<HTMLInputElement>("#body_input_field")!.addEventListener("input", setBodyValue)
document.querySelector<HTMLInputElement>("#mind_input_field")!.addEventListener("input", setMindValue)
document.querySelector<HTMLInputElement>("#soul_input_field")!.addEventListener("input", setSoulValue)

// Aqua Ghyranis
function setAquaGhyranis(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.aqua_ghyranis = +this.value;
}

document.querySelector<HTMLInputElement>("#aqua_hyranis_editor")!.addEventListener("input", setAquaGhyranis)

// Armour
function setCharacterArmour(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.armour = +this.value;
}

document.querySelector<HTMLInputElement>("#armour_input")!.addEventListener("input", setCharacterArmour)

// Shield
function setCharacterShield(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   if (this.checked)
      selectedCharacter.shield_bonus = 1;
   else
      selectedCharacter.shield_bonus = 0;

   updateCharacterDefence();
}

document.querySelector<HTMLInputElement>("#has_shield_toggle")!.addEventListener("input", setCharacterShield)

// Remaining Mettle
function setCharacterRemainingMettle(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.remaining_mettle = +this.value;
}

document.querySelector<HTMLInputElement>("#remaining_mettle_input")!.addEventListener("input", setCharacterRemainingMettle)

// Remaining Toughness
function setCharacterRemainingToughness(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.remaining_toughness = +this.value;
}
document.querySelector<HTMLInputElement>("#remaining_toughness_input")!.addEventListener("input", setCharacterRemainingToughness)

// Remaining Wounds
function setCharacterRemainingWounds(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.remaining_wounds = +this.value;
}
document.querySelector<HTMLInputElement>("#remaining_wounds_input")!.addEventListener("input", setCharacterRemainingWounds)


// Long/Short Term Goals
function setShortTermGoal(this: HTMLTextAreaElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.short_term_goal = this.value;
}

function setLongTermGoal(this: HTMLTextAreaElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.long_term_goal = this.value;
}

document.querySelector<HTMLTextAreaElement>("#character_editor_stg_input")!.addEventListener("input", setShortTermGoal)
document.querySelector<HTMLTextAreaElement>("#character_editor_ltg_input")!.addEventListener("input", setLongTermGoal)

// Talents Add/Remove
function setActiveEditTalent(name: string) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;
   selectedTalentName = name;

   let selectedTalent = selectedCharacter.talents[selectedTalentName];

   document.querySelector<HTMLDivElement>("#talent_editor_panel")!.classList.remove("hidden");

   document.querySelector<HTMLInputElement>("#editor_talent_name")!.value = selectedTalent.name;
   document.querySelector<HTMLInputElement>("#editor_talent_cost")!.value = selectedTalent.cost.toString();
   document.querySelector<HTMLTextAreaElement>("#editor_talent_description")!.value = selectedTalent.description;
}

function onTalentSelected(this: HTMLSelectElement) {
   setActiveEditTalent(this.value);
}

function addTalent() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   let newOption: HTMLOptionElement = document.createElement("option");

   let name = prompt("Talent Name")!;

   while (selectedCharacter.talents[name]) {
      alert("Error: Talent already exists.");
      name = prompt("Talent Name")!;
   }

   // Character List Update
   selectedCharacter.talents[name] = new Talent(name);

   // Character Dropdown
   newOption.value = name;
   newOption.innerText = name;

   let talent_list = document.querySelector<HTMLSelectElement>("#editor_talent_list_dropdown")!;

   talent_list.appendChild(newOption);
   talent_list.value = name;

   // Activate Talent
   setActiveEditTalent(name);

   updateRemainingXp();
}

function removeTalent() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;
   delete selectedCharacter.talents[selectedTalentName];

   let talent_list = document.querySelector<HTMLSelectElement>("#editor_talent_list_dropdown")!;

   let selectedOptions = talent_list.selectedOptions;

   for (let index = 0; index < selectedOptions.length; index++) {
      talent_list.removeChild(selectedOptions[index]);
   }

   if (talent_list.childElementCount > 0) {
      let newSelected = talent_list.options[0];

      talent_list.value = newSelected.value;
      setActiveEditTalent(newSelected.value);
   }
   else {
      selectedTalentName = "";
      talent_list.value = "";
      document.querySelector<HTMLDivElement>("#talent_editor_panel")!.classList.add("hidden");
   }

   updateRemainingXp();
}

document.querySelector<HTMLSelectElement>("#editor_talent_list_dropdown")!.addEventListener("change", onTalentSelected)
document.querySelector<HTMLButtonElement>("#add_talent")!.addEventListener("click", addTalent)
document.querySelector<HTMLButtonElement>("#remove_talent")!.addEventListener("click", removeTalent)

// Talent Editor
function setTalentName(this: HTMLInputElement): boolean {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   if (selectedCharacter.talents[this.value] !== undefined) {
      alert("Error: Talent already exists.");
      return false;
   }
   let selectedTalent = selectedCharacter.talents[selectedTalentName];

   selectedTalent.name = this.value;

   delete selectedCharacter.talents[selectedTalentName];
   selectedCharacter.talents[selectedTalent.name] = selectedTalent;

   let talent_list = document.querySelector<HTMLSelectElement>("#editor_talent_list_dropdown")!;

   for (var optionChild of talent_list.children) {
      if ((optionChild as HTMLOptionElement).value == selectedTalentName) {
         (optionChild as HTMLOptionElement).value = selectedTalent.name;
         (optionChild as HTMLOptionElement).innerText = selectedTalent.name;
         break;
      }
   }

   selectedTalentName = selectedTalent.name;
   talent_list.value = selectedTalentName;

   return true;
}

function setTalentCost(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.talents[selectedTalentName].cost = +this.value;

   updateRemainingXp();
}

function setTalentDescription(this: HTMLTextAreaElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.talents[selectedTalentName].description = this.value;
}

document.querySelector<HTMLInputElement>("#editor_talent_name")!.addEventListener("input", setTalentName)
document.querySelector<HTMLInputElement>("#editor_talent_cost")!.addEventListener("input", setTalentCost)
document.querySelector<HTMLTextAreaElement>("#editor_talent_description")!.addEventListener("input", setTalentDescription)

// Export/Import Character
function exportCharacter() {
   let jsonString = JSON.stringify(globalCharacterDictionary.get(selectedCharacterName)!);

   var a = document.createElement("a");
   var file = new Blob([jsonString], { type: "application/json" });
   a.href = URL.createObjectURL(file);
   a.download = selectedCharacterName + ".json";
   a.click();
   URL.revokeObjectURL(a.href);
}

async function importCharacter(this: HTMLInputElement) {
   if (this.files && this.files.length === 1) {
      let textPromise = await this.files[0].text();

      let fileObject = JSON.parse(textPromise);
      let importedCharacter = new CharacterSheet(fileObject.name);

      importedCharacter = Object.assign(importedCharacter, fileObject);

      globalCharacterDictionary.set(importedCharacter.name, importedCharacter);

      handleNewCharacter(importedCharacter.name);
   }
}

function importCharacterClick() {
   const elem = document.createElement("input");
   elem.type = "file";
   elem.accept = "json";
   elem.addEventListener("change", importCharacter);
   elem.click();
}

document.querySelector<HTMLButtonElement>("#export_character")!.addEventListener("click", exportCharacter);
document.querySelector<HTMLButtonElement>("#import_character")!.addEventListener("click", importCharacterClick);

// Talent Tab Button
function talentTabClick() {
   document.querySelector<HTMLDivElement>('#talent_editor_window')!.classList.remove("hidden");
   document.querySelector<HTMLDivElement>('#character_editor_stg_input')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#character_editor_ltg_input')!.classList.add("hidden");

   document.querySelector<HTMLDivElement>('#talent_tab_button')!.classList.add("bg-[#c6dcff]", "border-1", "border-black");
   document.querySelector<HTMLDivElement>('#stg_tab_button')!.classList.remove("bg-[#c6dcff]", "border-1", "border-black");
   document.querySelector<HTMLDivElement>('#ltg_tab_button')!.classList.remove("bg-[#c6dcff]", "border-1", "border-black");
}
document.querySelector<HTMLButtonElement>("#talent_tab_button")!.addEventListener("click", talentTabClick);

// STG Tab Button
function stgTabClick() {
   document.querySelector<HTMLDivElement>('#talent_editor_window')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#character_editor_stg_input')!.classList.remove("hidden");
   document.querySelector<HTMLDivElement>('#character_editor_ltg_input')!.classList.add("hidden");

   document.querySelector<HTMLDivElement>('#talent_tab_button')!.classList.remove("bg-[#c6dcff]", "border-1", "border-black");
   document.querySelector<HTMLDivElement>('#stg_tab_button')!.classList.add("bg-[#c6dcff]", "border-1", "border-black");
   document.querySelector<HTMLDivElement>('#ltg_tab_button')!.classList.remove("bg-[#c6dcff]", "border-1", "border-black");
}
document.querySelector<HTMLButtonElement>("#stg_tab_button")!.addEventListener("click", stgTabClick);

// LTG Tab Button
function ltgTabClick() {
   document.querySelector<HTMLDivElement>('#talent_editor_window')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#character_editor_stg_input')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#character_editor_ltg_input')!.classList.remove("hidden");

   document.querySelector<HTMLDivElement>('#talent_tab_button')!.classList.remove("bg-[#c6dcff]", "border-1", "border-black");
   document.querySelector<HTMLDivElement>('#stg_tab_button')!.classList.remove("bg-[#c6dcff]", "border-1", "border-black");
   document.querySelector<HTMLDivElement>('#ltg_tab_button')!.classList.add("bg-[#c6dcff]", "border-1", "border-black");
}
document.querySelector<HTMLButtonElement>("#ltg_tab_button")!.addEventListener("click", ltgTabClick);

// Current Character
function updatePlayedCharacterSheet() {
   if (currentlyPlayedEntityType != "Player" || currentlyPlayedEntity == "") {
      document.querySelector<HTMLDivElement>('#active_character_sheet')!.classList.add("hidden");
   }
   else {
      document.querySelector<HTMLDivElement>('#active_character_sheet')!.classList.remove("hidden");

      let selectedCharacter = globalCharacterDictionary.get(currentlyPlayedEntity)!;

      document.querySelector<HTMLDivElement>('#current_character_name')!.textContent = selectedCharacter.name;

      document.querySelector<HTMLInputElement>('#current_character_remaining_toughness')!.value = selectedCharacter.remaining_toughness.toString();
      document.querySelector<HTMLDivElement>('#current_character_total_toughness')!.textContent = selectedCharacter.getTotalToughness().toString();

      document.querySelector<HTMLInputElement>('#current_character_remaining_wounds')!.value = selectedCharacter.remaining_wounds.toString();
      document.querySelector<HTMLDivElement>('#current_character_total_wounds')!.textContent = selectedCharacter.getTotalWounds().toString();

      document.querySelector<HTMLInputElement>('#current_character_remaining_mettle')!.value = selectedCharacter.remaining_mettle.toString();
      document.querySelector<HTMLDivElement>('#current_character_total_mettle')!.textContent = selectedCharacter.getTotalMettle().toString();

      document.querySelector<HTMLDivElement>('#current_character_initiative_display')!.textContent = selectedCharacter.getInitiative().toString();

      document.querySelector<HTMLDivElement>('#current_character_armour_display')!.textContent = selectedCharacter.armour.toString();

      document.querySelector<HTMLDivElement>('#current_character_melee_display')!.textContent = selectedCharacter.getMeleeText();
      document.querySelector<HTMLDivElement>('#current_character_accuracy_display')!.textContent = selectedCharacter.getAccuracyText();
      document.querySelector<HTMLDivElement>('#current_character_defence_display')!.textContent = selectedCharacter.getDefenceText();

      document.querySelector<HTMLInputElement>('#current_character_mortally_wounded_display')!.checked = selectedCharacter.is_mortally_wounded;

      document.querySelector<HTMLInputElement>('#current_character_natural_awareness_display')!.textContent = selectedCharacter.getNaturalAwareness().toString();
   }
}

updatePlayedCharacterSheet()

// Active Character - Is Mortally Wounded
function changeActiveCharacterMortallyWounded(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(currentlyPlayedEntity)!;

   selectedCharacter.is_mortally_wounded = this.checked;
}

document.querySelector<HTMLInputElement>('#current_character_mortally_wounded_display')!.addEventListener("change", changeActiveCharacterMortallyWounded);

// Active Character - Remaining Toughness
function changeActiveCharacterRemainingToughness(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(currentlyPlayedEntity)!;

   selectedCharacter.remaining_toughness = +this.value;
}

document.querySelector<HTMLInputElement>('#current_character_remaining_toughness')!.addEventListener("input", changeActiveCharacterRemainingToughness);

// Active Character - Remaining Wounds
function changeActiveCharacterRemainingWounds(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(currentlyPlayedEntity)!;

   selectedCharacter.remaining_wounds = +this.value;
}

document.querySelector<HTMLInputElement>('#current_character_remaining_wounds')!.addEventListener("input", changeActiveCharacterRemainingWounds);

// Active Character - Remaining Mettle
function changeActiveCharacterRemainingMettle(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(currentlyPlayedEntity)!;

   selectedCharacter.remaining_mettle = +this.value;
}

document.querySelector<HTMLInputElement>('#current_character_remaining_mettle')!.addEventListener("input", changeActiveCharacterRemainingMettle);

// Active Character - Roll Initiative
function activeCharacterRollInitiative() {
   let selectedCharacter = globalCharacterDictionary.get(currentlyPlayedEntity)!

   let rollResults = rollND6(2);

   const sum = rollResults.reduce((accumulator, currentValue) => accumulator + currentValue, 0) + selectedCharacter.getInitiative();

   sendMessageToChat(`${currentUserName} has rolled Initiative: [${rollResults}] + ${selectedCharacter.getInitiative()} = ${sum}`);
}

document.querySelector<HTMLButtonElement>("#current_character_roll_initiative")!.addEventListener("click", activeCharacterRollInitiative);


function getDNFromStatVsDefence(stat: number, defence: number): number {
   if (stat - defence >= 2) {
      return 2;
   }
   else if (stat - defence == 1) {
      return 3;
   }
   else if (stat - defence == 0) {
      return 4;
   }
   else if (stat - defence == -1) {
      return 5;
   }
   else {
      return 6;
   }
}

function rollToHitMelee() {
   let targetDefence = parseInt(document.querySelector<HTMLSelectElement>("#active_character_target_defence")!.value);

   let selectedCharacter = globalCharacterDictionary.get(currentlyPlayedEntity)!

   let difficultNumber = getDNFromStatVsDefence(selectedCharacter.getMelee(), targetDefence);

   let diceNumber = selectedCharacter.attributes.body + selectedCharacter.skills.weapon_skill.training;

   let rollResults = rollND6(diceNumber);

   let numberOfSuccesses = rollResults.filter((value) => { return value >= difficultNumber; }).length;

   sendMessageToChat(`${currentUserName} has attacked [M<${selectedCharacter.getMeleeText()}> vs D<${MAD_TEXT[targetDefence]}>]: ${rollResults} = ${numberOfSuccesses}S.`);
}

document.querySelector<HTMLButtonElement>("#active_character_roll_melee")!.addEventListener("click", rollToHitMelee)

function rollToHitAccuracy() {
   let targetDefence = parseInt(document.querySelector<HTMLSelectElement>("#active_character_target_defence")!.value);

   let selectedCharacter = globalCharacterDictionary.get(currentlyPlayedEntity)!

   let difficultNumber = getDNFromStatVsDefence(selectedCharacter.getAccuracy(), targetDefence);

   let diceNumber = selectedCharacter.attributes.body + selectedCharacter.skills.ballistic_skill.training;

   let rollResults = rollND6(diceNumber);

   let numberOfSuccesses = rollResults.filter((value) => { return value >= difficultNumber; }).length;

   sendMessageToChat(`${currentUserName} has attacked [A<${selectedCharacter.getAccuracyText()}> vs D<${MAD_TEXT[targetDefence]}>]: ${rollResults} = ${numberOfSuccesses}S.`);
}

document.querySelector<HTMLButtonElement>("#active_character_roll_ranged")!.addEventListener("click", rollToHitAccuracy)

// ========================================================================================
// Bestiary
// ========================================================================================
function setSelectedMonster(name: string) {
   selectedMonsterName = name;

   if (name == "") {
      document.querySelector<HTMLDivElement>("#edit_monster_sheet")!.classList.add("hidden");
      document.querySelector<HTMLButtonElement>("#export_monster")!.classList.add("hidden");
      document.querySelector<HTMLButtonElement>("#add_monster_to_initiative")!.classList.add("hidden");
   }
   else {
      let currentSelectedMonster = globalMonsterDictionary.get(name)!;

      document.querySelector<HTMLDivElement>("#edit_monster_sheet")!.classList.remove("hidden");
      document.querySelector<HTMLButtonElement>("#export_monster")!.classList.remove("hidden");
      document.querySelector<HTMLButtonElement>("#add_monster_to_initiative")!.classList.remove("hidden");

      // Name Row
      document.querySelector<HTMLInputElement>("#monster_name_input")!.value = currentSelectedMonster.name;

      // Monster Type Row
      document.querySelector<HTMLSelectElement>("#monster_editor_size")!.value = currentSelectedMonster.size;
      document.querySelector<HTMLInputElement>("#monster_editor_species")!.value = currentSelectedMonster.species;
      document.querySelector<HTMLSelectElement>("#monster_editor_type")!.value = currentSelectedMonster.type;

      // Monster Left Stats
      document.querySelector<HTMLInputElement>("#monster_editor_initiative_input")!.value = currentSelectedMonster.initiative.toString();
      document.querySelector<HTMLInputElement>("#monster_editor_toughness_input")!.value = currentSelectedMonster.total_toughness.toString();
      document.querySelector<HTMLInputElement>("#monster_editor_wounds_input")!.value = currentSelectedMonster.total_wounds.toString();
      document.querySelector<HTMLInputElement>("#monster_editor_mettle_input")!.value = currentSelectedMonster.total_mettle.toString();
      document.querySelector<HTMLInputElement>("#monster_editor_armour_input")!.value = currentSelectedMonster.armour.toString();

      // Monster Right Stats

      // Melee
      for (let index = 0; index < 6; index++) {
         document.querySelector<HTMLDivElement>("#monster_melee_" + index.toString())!.classList.remove("bg-gray-500");
      }

      document.querySelector<HTMLDivElement>("#monster_melee_" + currentSelectedMonster.melee.toString())!.classList.add("bg-gray-500");

      // Accuracy
      for (let index = 0; index < 6; index++) {
         document.querySelector<HTMLDivElement>("#monster_accuracy_" + index.toString())!.classList.remove("bg-gray-500");
      }

      document.querySelector<HTMLDivElement>("#monster_accuracy_" + currentSelectedMonster.accuracy.toString())!.classList.add("bg-gray-500");

      // Defence
      for (let index = 0; index < 6; index++) {
         document.querySelector<HTMLDivElement>("#monster_defence_" + index.toString())!.classList.remove("bg-gray-500");
      }

      document.querySelector<HTMLDivElement>("#monster_defence_" + currentSelectedMonster.defence.toString())!.classList.add("bg-gray-500");

      // Attacks
      document.querySelector<HTMLTableElement>("#attack_list")!.replaceChildren();

      for (const attackName in currentSelectedMonster.attacks) {
         handleNewAttack(currentSelectedMonster.attacks[attackName]);
      }
   }
}

function handleNewMonster(name: string) {
   let newOption: HTMLOptionElement = document.createElement("option");

   // Character Dropdown
   newOption.value = name;
   newOption.innerText = name;

   let monster_list = document.querySelector<HTMLSelectElement>("#monster_list_dropdown")!;

   monster_list.appendChild(newOption);
   monster_list.value = name;

   // Activate Character
   setSelectedMonster(name);
}

function addMonsterClick() {
   let name = prompt("Monster Name")!;

   while (globalMonsterDictionary.has(name)) {
      alert("Error: Monster already exists.");
      name = prompt("Monster Name")!;
   }

   // Character List Update
   globalMonsterDictionary.set(name, new MonsterSheet(name));

   selectedMonsterName = name;

   handleNewMonster(name);
}

document.querySelector<HTMLButtonElement>("#add_monster")!.addEventListener("click", addMonsterClick);

function removeMonsterClick() {
   globalMonsterDictionary.delete(selectedMonsterName);

   let monster_list = document.querySelector<HTMLSelectElement>("#monster_list_dropdown")!;

   let selectedOptions = monster_list.selectedOptions;

   for (let index = 0; index < selectedOptions.length; index++) {
      monster_list.removeChild(selectedOptions[index]);
   }

   let newSelectedMonsterName = "";

   if (monster_list.childElementCount > 0) {
      newSelectedMonsterName = monster_list.options[0].value;
   }

   monster_list.value = newSelectedMonsterName;
   setSelectedMonster(newSelectedMonsterName);
}

document.querySelector<HTMLButtonElement>("#remove_monster")!.addEventListener("click", removeMonsterClick);

function onMonsterSelected(this: HTMLSelectElement) {
   setSelectedMonster(this.value);
}

document.querySelector<HTMLSelectElement>("#monster_list_dropdown")!.addEventListener("change", onMonsterSelected);

function addMonsterToInitiative() {
   let currentSelectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;

   let monsterCopy = new MonsterSheet("");

   monsterCopy = Object.assign(monsterCopy, currentSelectedMonster);

   monsterCopy.name = toTitleCase(faker.word.adjective()) + " " + monsterCopy.name;

   handleNewEntry(new InitiativeEntry(monsterCopy.initiative, monsterCopy));
}

document.querySelector<HTMLButtonElement>("#add_monster_to_initiative")!.addEventListener("click", addMonsterToInitiative);

// --- Export/Import Monster --- 
function exportMonster() {
   let jsonString = JSON.stringify(globalMonsterDictionary.get(selectedMonsterName)!);

   var a = document.createElement("a");
   var file = new Blob([jsonString], { type: "application/json" });
   a.href = URL.createObjectURL(file);
   a.download = selectedMonsterName + ".json";
   a.click();
   URL.revokeObjectURL(a.href);
}

async function importMonster(this: HTMLInputElement) {
   if (this.files && this.files.length === 1) {
      let textPromise = await this.files[0].text();

      let fileObject = JSON.parse(textPromise);
      let importedMonster = new MonsterSheet(fileObject.name);

      importedMonster = Object.assign(importedMonster, fileObject);

      globalMonsterDictionary.set(importedMonster.name, importedMonster);

      handleNewMonster(importedMonster.name);
   }
}

function importMonsterClick() {
   const elem = document.createElement("input");
   elem.type = "file";
   elem.accept = "json";
   elem.addEventListener("change", importMonster);
   elem.click();
}

document.querySelector<HTMLButtonElement>("#import_monster")!.addEventListener("click", importMonsterClick);
document.querySelector<HTMLButtonElement>("#export_monster")!.addEventListener("click", exportMonster);

// --- Monster Name Update --- 
function setMonsterName(this: HTMLInputElement): boolean {
   if (globalMonsterDictionary.get(this.value) !== undefined) {
      alert("Error: Monster already exists.");
      return false;
   }

   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;

   selectedMonster.name = this.value;

   globalMonsterDictionary.delete(selectedMonsterName)!;
   globalMonsterDictionary.set(selectedMonster.name, selectedMonster);


   let monster_list = document.querySelector<HTMLSelectElement>("#monster_list_dropdown")!;

   for (var optionChild of monster_list.children) {
      if ((optionChild as HTMLOptionElement).value == selectedMonsterName) {
         (optionChild as HTMLOptionElement).value = selectedMonster.name;
         (optionChild as HTMLOptionElement).innerText = selectedMonster.name;
         break;
      }
   }

   selectedMonsterName = selectedMonster.name;
   monster_list.value = selectedMonsterName;

   return true;
}
document.querySelector<HTMLInputElement>("#monster_name_input")!.addEventListener("input", setMonsterName);


// --- Monster Type Row Updates --- 
function updateMonsterSize(this: HTMLSelectElement) {
   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.size = this.value;
}
document.querySelector<HTMLInputElement>("#monster_editor_size")!.addEventListener("change", updateMonsterSize);

function updateMonsterSpecies(this: HTMLInputElement) {
   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.species = this.value;
}
document.querySelector<HTMLInputElement>("#monster_editor_species")!.addEventListener("change", updateMonsterSpecies);

function updateMonsterType(this: HTMLSelectElement) {
   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.type = this.value;
}
document.querySelector<HTMLInputElement>("#monster_editor_type")!.addEventListener("change", updateMonsterType);


// --- Monster Left Stats Updates --- 
function updateMonsterInitiative(this: HTMLInputElement) {
   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.initiative = +this.value;
}
document.querySelector<HTMLInputElement>("#monster_editor_initiative_input")!.addEventListener("input", updateMonsterInitiative);

function updateMonsterTotalToughness(this: HTMLInputElement) {
   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.total_toughness = +this.value;
}
document.querySelector<HTMLInputElement>("#monster_editor_toughness_input")!.addEventListener("input", updateMonsterTotalToughness);

function updateMonsterTotalWounds(this: HTMLInputElement) {
   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.total_wounds = +this.value;
}
document.querySelector<HTMLInputElement>("#monster_editor_wounds_input")!.addEventListener("input", updateMonsterTotalWounds);

function updateMonsterTotalMettle(this: HTMLInputElement) {
   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.total_mettle = +this.value;
}
document.querySelector<HTMLInputElement>("#monster_editor_mettle_input")!.addEventListener("input", updateMonsterTotalMettle);

function updateMonsterArmour(this: HTMLInputElement) {
   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.armour = +this.value;
}
document.querySelector<HTMLInputElement>("#monster_editor_armour_input")!.addEventListener("input", updateMonsterArmour);

// --- Monster MAD Updates ---

// Melee
function updateMonsterMelee(this: HTMLDivElement) {
   let melee_val = this.getAttribute("data-val")!;

   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.melee = +melee_val;


   for (let index = 0; index < 6; index++) {
      document.querySelector<HTMLDivElement>("#monster_melee_" + index.toString())!.classList.remove("bg-gray-500");
   }

   document.querySelector<HTMLDivElement>("#monster_melee_" + melee_val)!.classList.add("bg-gray-500");
}

document.querySelector<HTMLDivElement>("#monster_melee_0")!.addEventListener("click", updateMonsterMelee);
document.querySelector<HTMLDivElement>("#monster_melee_1")!.addEventListener("click", updateMonsterMelee);
document.querySelector<HTMLDivElement>("#monster_melee_2")!.addEventListener("click", updateMonsterMelee);
document.querySelector<HTMLDivElement>("#monster_melee_3")!.addEventListener("click", updateMonsterMelee);
document.querySelector<HTMLDivElement>("#monster_melee_4")!.addEventListener("click", updateMonsterMelee);
document.querySelector<HTMLDivElement>("#monster_melee_5")!.addEventListener("click", updateMonsterMelee);

// Accuracy
function updateMonsterAccuracy(this: HTMLDivElement) {
   let accuracy_val = this.getAttribute("data-val")!;

   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.accuracy = +accuracy_val;


   for (let index = 0; index < 6; index++) {
      document.querySelector<HTMLDivElement>("#monster_accuracy_" + index.toString())!.classList.remove("bg-gray-500");
   }

   document.querySelector<HTMLDivElement>("#monster_accuracy_" + accuracy_val)!.classList.add("bg-gray-500");
}

document.querySelector<HTMLDivElement>("#monster_accuracy_0")!.addEventListener("click", updateMonsterAccuracy);
document.querySelector<HTMLDivElement>("#monster_accuracy_1")!.addEventListener("click", updateMonsterAccuracy);
document.querySelector<HTMLDivElement>("#monster_accuracy_2")!.addEventListener("click", updateMonsterAccuracy);
document.querySelector<HTMLDivElement>("#monster_accuracy_3")!.addEventListener("click", updateMonsterAccuracy);
document.querySelector<HTMLDivElement>("#monster_accuracy_4")!.addEventListener("click", updateMonsterAccuracy);
document.querySelector<HTMLDivElement>("#monster_accuracy_5")!.addEventListener("click", updateMonsterAccuracy);

// Defence
function updateMonsterDefence(this: HTMLDivElement) {
   let defence_val = this.getAttribute("data-val")!;

   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   selectedMonster.defence = +defence_val;


   for (let index = 0; index < 6; index++) {
      document.querySelector<HTMLDivElement>("#monster_defence_" + index.toString())!.classList.remove("bg-gray-500");
   }

   document.querySelector<HTMLDivElement>("#monster_defence_" + defence_val)!.classList.add("bg-gray-500");
}

document.querySelector<HTMLDivElement>("#monster_defence_0")!.addEventListener("click", updateMonsterDefence);
document.querySelector<HTMLDivElement>("#monster_defence_1")!.addEventListener("click", updateMonsterDefence);
document.querySelector<HTMLDivElement>("#monster_defence_2")!.addEventListener("click", updateMonsterDefence);
document.querySelector<HTMLDivElement>("#monster_defence_3")!.addEventListener("click", updateMonsterDefence);
document.querySelector<HTMLDivElement>("#monster_defence_4")!.addEventListener("click", updateMonsterDefence);
document.querySelector<HTMLDivElement>("#monster_defence_5")!.addEventListener("click", updateMonsterDefence);

// --- Attacks --- 
function deleteAttack(attack: Attack) {
   console.log(attack.name.replace(" ", "_"))
   document.querySelector<HTMLTableRowElement>("#attack_table_row_" + attack.name.replace(" ", "_"))!.remove();

   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;
   delete selectedMonster.attacks[attack.name];
}

function handleNewAttack(attack: Attack) {
   let tableRow = document.createElement("tr");
   tableRow.id = "attack_table_row_" + attack.name.replace(" ", "_");

   // Name
   let attackNameInput = document.createElement("input");
   attackNameInput.classList.add("text-center");
   attackNameInput.value = attack.name;

   function updateAttackName(this: HTMLInputElement): boolean {
      let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;

      if (selectedMonster.attacks[this.value] !== undefined) {
         alert("Error: Attack already exists.");
         return false;
      }

      delete selectedMonster.attacks[attack.name];

      attack.name = this.value;

      selectedMonster.attacks[attack.name] = attack;
      return true;
   }

   attackNameInput.addEventListener("input", updateAttackName);

   let rowHeader = document.createElement("th");
   rowHeader.scope = "row"
   rowHeader.appendChild(attackNameInput);

   tableRow.appendChild(rowHeader);

   // Damage
   let damageInput = document.createElement("input");
   damageInput.classList.add("text-center", "bg-[#c6dcff]", "border-black", "border-1", "rounded-lg", "w-1/2");
   damageInput.value = attack.damage.toString();

   function updateDamageValue(this: HTMLInputElement) {
      attack.damage = +this.value;
   }

   damageInput.addEventListener("input", updateDamageValue)

   {
      let fieldTd = document.createElement("td");
      fieldTd.appendChild(damageInput);

      tableRow.appendChild(fieldTd);
   }

   // is Ranged
   let isRangedInput = document.createElement("input");
   isRangedInput.classList.add("text-center", "bg-[#c6dcff]", "border-black", "border-1", "rounded-lg", "w-1/2");
   isRangedInput.type = "checkbox";
   isRangedInput.checked = attack.is_ranged;

   function updateIsRangedValue(this: HTMLInputElement) {
      attack.is_ranged = this.checked;
   }

   isRangedInput.addEventListener("change", updateIsRangedValue)

   {
      let fieldTd = document.createElement("td");
      fieldTd.appendChild(isRangedInput);

      tableRow.appendChild(fieldTd);
   }

   // Focus
   let focusInput = document.createElement("input");
   focusInput.classList.add("text-center", "bg-[#c6dcff]", "border-black", "border-1", "rounded-lg", "w-1/2");
   focusInput.value = attack.focus.toString();

   function updateFocusValue(this: HTMLInputElement) {
      attack.focus = +this.value;
   }

   focusInput.addEventListener("input", updateFocusValue)

   {
      let fieldTd = document.createElement("td");
      fieldTd.appendChild(focusInput);

      tableRow.appendChild(fieldTd);
   }

   // Delete
   let deleteButton = document.createElement("button");
   deleteButton.classList.add("bg-red-500", "text-white", "border-1", "rounded-lg", "border-black", "hover:border-white", "font-bold", "w-[4vw]");
   deleteButton.textContent = "DEL";
   deleteButton.addEventListener("click", () => { deleteAttack(attack) });

   {
      let fieldTd = document.createElement("td");
      fieldTd.appendChild(deleteButton);

      tableRow.appendChild(fieldTd);
   }

   document.querySelector<HTMLTableElement>("#attack_list")!.appendChild(tableRow);
}

function addAttackClick() {
   let selectedMonster = globalMonsterDictionary.get(selectedMonsterName)!;

   let name = prompt("Attack Name")!;

   while (selectedMonster.attacks[name] !== undefined) {
      alert("Error: Attack already exists.");
      name = prompt("Attack Name")!;
   }

   let attack = new Attack(name);
   selectedMonster.attacks[name] = attack;

   handleNewAttack(attack);
}
document.querySelector<HTMLButtonElement>("#add_attack_button")!.addEventListener("click", addAttackClick);

// --------- Initiative ---------
function renderInitiativeMap() {
   let initiativeBox = document.querySelector<HTMLDivElement>("#initiative_box")!;

   // Clear Existing Entries
   while (initiativeBox.lastChild) {
      initiativeBox.removeChild(initiativeBox.lastChild);
   }

   let initiativeOrder = [...initiativeMap.entries()];

   initiativeOrder.sort(function (a, b) { return compareEntries(a[1], b[1]); });

   for (let idx = 0; idx < initiativeOrder.length; ++idx) {
      let uid = initiativeOrder[idx][0];
      let entry = initiativeOrder[idx][1];

      let entryHTML = document.createElement("div");
      entryHTML.classList.add("grid", "grid-cols-[10vw_1fr]", "border-b-1", "border-black");

      if (idx == initiativeIndex) {
         entryHTML.classList.add("bg-[#72a6fa]");
         initiativeUid = uid;
      }

      entryHTML.addEventListener("contextmenu", function (e) {
         handleRemovingEntry(uid);
         broadcastInitiativeUpdate(new InitiativeUpdate(uid, null));
         e.preventDefault();
      })

      let entryHTMLInitiative = document.createElement("div");
      entryHTMLInitiative.classList.add("text-center", "border-black", "border-r-2");
      entryHTMLInitiative.textContent = entry.initiative_value.toString();

      entryHTML.appendChild(entryHTMLInitiative);

      let entryHTMLName = document.createElement("div");
      entryHTMLName.classList.add("text-center");
      entryHTMLName.textContent = entry.getName();

      entryHTML.appendChild(entryHTMLName);

      initiativeBox.appendChild(entryHTML);
   }
}

function handleEntryUpdate(id: string, newEntry: InitiativeEntry) {
   initiativeMap.set(id, newEntry);

   renderInitiativeMap();
}

function handleNewEntry(newEntry: InitiativeEntry) {
   let uid = crypto.randomUUID();

   handleEntryUpdate(uid, newEntry);

   broadcastInitiativeUpdate(new InitiativeUpdate(uid, newEntry));
}

function handleRemovingEntry(entryId: string) {
   initiativeMap.delete(entryId);

   renderInitiativeMap();
}

function handleInitiativeIndexChange() {
   let entry = initiativeMap.get(initiativeUid)!;

   if (entry.entity instanceof MonsterSheet) {
      // Do Something
   }
   else if (globalCharacterDictionary.has(entry.entity)) {
      currentlyPlayedEntityType = "Player";
      currentlyPlayedEntity == entry.entity;

      updatePlayedCharacterSheet();
   }
   else {
      // Nothing to do
   }
}

// Initiative Buttons
function goToPreviousInitiative() {
   if ((initiativeIndex--) == 0) {
      initiativeIndex = initiativeMap.size - 1;
   }

   handleInitiativeIndexChange();

   renderInitiativeMap();

   broadcastInitiativeIndex();
}

document.querySelector<HTMLButtonElement>("#previous_initiative")!.addEventListener("click", goToPreviousInitiative);

function resetInitiative() {
   initiativeIndex = 0;

   handleInitiativeIndexChange();

   renderInitiativeMap();

   broadcastInitiativeIndex();
}

document.querySelector<HTMLButtonElement>("#reset_initiative")!.addEventListener("click", resetInitiative);

function goToNextInitiative() {
   if ((++initiativeIndex) == initiativeMap.size) {
      initiativeIndex = 0;
   }

   handleInitiativeIndexChange();

   renderInitiativeMap();

   broadcastInitiativeIndex();
}

document.querySelector<HTMLButtonElement>("#next_initiative")!.addEventListener("click", goToNextInitiative);

// ========================================================================================
// OBR INTEGRATION
// ========================================================================================

// TX
function broadcastMessage(msg: string) {
   if (OBR.isAvailable && OBR.isReady) {
      OBR.broadcast.sendMessage("squigrodeo.chat_message", msg);
   }
}

function broadcastInitiativeUpdate(initiativeUpdate: InitiativeUpdate) {
   if (OBR.isAvailable && OBR.isReady) {
      OBR.broadcast.sendMessage("squigrodeo.initiative_update", initiativeUpdate);
   }
}

function broadcastInitiativeIndex() {
   if (OBR.isAvailable && OBR.isReady) {
      OBR.broadcast.sendMessage("squigrodeo.set_initiative_index", initiativeIndex);
   }
}

// RX
function receiveMessage(event: { data: unknown; connectionId: string; }) {
   logMessageToChat(event.data as string);
   console.log(`Received The Following Message: ${event.data}`)
}

function receiveInitiativeUpdate(event: { data: unknown; connectionId: string; }) {
   let entryUpdateData = (event.data as InitiativeUpdate);

   let entryUpdate = new InitiativeUpdate(entryUpdateData.uid, entryUpdateData.value);

   if (entryUpdateData.value != null) {
      entryUpdate.value = new InitiativeEntry(entryUpdate.value!.initiative_value, entryUpdate.value!.entity);

      if (typeof entryUpdate.value.entity != 'string') {
         entryUpdate.value.entity = Object.assign(new MonsterSheet(""), entryUpdate.value.entity);
      }

      handleEntryUpdate(entryUpdate.uid, entryUpdate.value);
      console.log("Adding New Entry");
   }
   else {
      handleRemovingEntry(entryUpdate.uid);
      console.log("Removing Entry");
   }

   console.log(`Received The Following Message: ${entryUpdateData}`)
}

function receiveSetInitiativeIndex(event: { data: unknown; connectionId: string; }) {
   initiativeIndex = (event.data as number);

   handleInitiativeIndexChange();

   renderInitiativeMap();
}

// Setup
if (OBR.isAvailable) {

   async function setUserName() {
      currentUserName = await OBR.player.getName();
      console.log(`HELLO ${currentUserName}!`);
   }

   OBR.onReady(() => {
      OBR.broadcast.onMessage("squigrodeo.chat_message", receiveMessage);
      OBR.broadcast.onMessage("squigrodeo.initiative_update", receiveInitiativeUpdate);
      OBR.broadcast.onMessage("squigrodeo.set_initiative_index", receiveSetInitiativeIndex);
      setUserName();
   });
}
else {
   console.log("OBR INTEGRATION DISABLED");
}