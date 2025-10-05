import { CharacterSheet, SkillTable, Skill, Talent, MAD_TEXT } from "./CharacterSheet";
import { toTitleCase } from "./utilities";

import OBR from "@owlbear-rodeo/sdk";

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
let numDice: number = 0;
let currentUserName: string = "Stellia";

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
let globalCharacterDictionary = new Map<string, CharacterSheet>();
let selectedCharacterName: string = "";

function setActiveEditCharacter(charName: string) {
   selectedCharacterName = charName;

   document.querySelector<HTMLDivElement>("#edit_character_sheet")!.classList.remove("hidden");
   document.querySelector<HTMLButtonElement>("#export_character")!.classList.remove("hidden");

   if (charName != currentlyPlayedEntity) {
      document.querySelector<HTMLButtonElement>("#play_character")!.classList.remove("hidden");
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

let currentlyPlayedEntity = "";
let currentlyPlayedEntityType = "";

function playCharacter() {
   currentlyPlayedEntity = selectedCharacterName;
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
      document.querySelector<HTMLDivElement>("#melee_" + index.toString())!.classList.remove("bg-gray-500");
   }

   document.querySelector<HTMLDivElement>("#melee_" + selectedCharacter.getMelee().toString())!.classList.add("bg-gray-500");
}

function updateCharacterAccuracy() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   for (let index = 0; index < 6; index++) {
      document.querySelector<HTMLDivElement>("#accuracy_" + index.toString())!.classList.remove("bg-gray-500");
   }

   document.querySelector<HTMLDivElement>("#accuracy_" + selectedCharacter.getAccuracy().toString())!.classList.add("bg-gray-500");
}

function updateCharacterDefence() {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   for (let index = 0; index < 6; index++) {
      document.querySelector<HTMLDivElement>("#defence_" + index.toString())!.classList.remove("bg-gray-500");
   }

   document.querySelector<HTMLDivElement>("#defence_" + selectedCharacter.getDefence().toString())!.classList.add("bg-gray-500");
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
let rollerSelectedAttribute = "body";

function skillRollerAttributeSelect(this: HTMLSelectElement) {
   rollerSelectedAttribute = this.value;
}
document.querySelector<HTMLSelectElement>("#active_character_attribute_dropdown")!.addEventListener("change", skillRollerAttributeSelect)

let rollerSelectedSkill = "arcana";

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
let selectedTalentName = "";

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

      let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

      document.querySelector<HTMLDivElement>('#current_character_name')!.textContent = selectedCharacterName;

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
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.is_mortally_wounded = this.checked;
}

document.querySelector<HTMLInputElement>('#current_character_mortally_wounded_display')!.addEventListener("change", changeActiveCharacterMortallyWounded);

// Active Character - Remaining Toughness
function changeActiveCharacterRemainingToughness(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.remaining_toughness = +this.value;
}

document.querySelector<HTMLInputElement>('#current_character_remaining_toughness')!.addEventListener("input", changeActiveCharacterRemainingToughness);

// Active Character - Remaining Wounds
function changeActiveCharacterRemainingWounds(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   selectedCharacter.remaining_wounds = +this.value;
}

document.querySelector<HTMLInputElement>('#current_character_remaining_wounds')!.addEventListener("input", changeActiveCharacterRemainingWounds);

// Active Character - Remaining Mettle
function changeActiveCharacterRemainingMettle(this: HTMLInputElement) {
   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

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
// OBR INTEGRATION
// ========================================================================================
function broadcastMessage(msg: string) {
   if (OBR.isAvailable && OBR.isReady) {
      OBR.broadcast.sendMessage("squigrodeo.chat_message", msg);
   }
}

function receiveMessage(event: { data: unknown; connectionId: string; }) {
   logMessageToChat(event.data as string);
   console.log(`Received The Following Message: ${event.data}`)
}

if (OBR.isAvailable) {

   async function setUserName() {
      currentUserName = await OBR.player.getName();
      console.log(`HELLO ${currentUserName}!`);
   }

   OBR.onReady(() => {
      OBR.broadcast.onMessage("squigrodeo.chat_message", receiveMessage);
      setUserName();
   });
}
else {
   console.log("OBR INTEGRATION DISABLED");
}