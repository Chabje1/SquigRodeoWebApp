import { CharacterSheet, SkillTable, Skill } from "./CharacterSheet";
import { toTitleCase } from "./utilities";

// Menu Navigation Button Logic
function homeButtonClick() {
   document.querySelector<HTMLDivElement>('#home_screen')!.classList.remove("hidden");
   document.querySelector<HTMLDivElement>('#character_screen')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#bestiary_screen')!.classList.add("hidden");
}

function charactersButtonClick() {
   document.querySelector<HTMLDivElement>('#home_screen')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#character_screen')!.classList.remove("hidden");
   document.querySelector<HTMLDivElement>('#bestiary_screen')!.classList.add("hidden");
}

function bestiaryButtonClick() {
   document.querySelector<HTMLDivElement>('#home_screen')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#character_screen')!.classList.add("hidden");
   document.querySelector<HTMLDivElement>('#bestiary_screen')!.classList.remove("hidden");
}

document.querySelector<HTMLButtonElement>("#home_button")!.addEventListener("click", homeButtonClick)
document.querySelector<HTMLButtonElement>("#characters_button")!.addEventListener("click", charactersButtonClick)
document.querySelector<HTMLButtonElement>("#bestiary_button")!.addEventListener("click", bestiaryButtonClick)

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
   let message: HTMLParagraphElement = document.createElement("p")
   let dn = document.querySelector<HTMLInputElement>("#diffNumHolder")!.valueAsNumber;

   message.innerText = currentUserName + " has rolled " + rollResults.toString();

   if (dn != 0) {
      let numberOfSuccesses = rollResults.filter((value) => { return value >= dn; }).length;

      message.innerText += " = " + numberOfSuccesses.toString() + " successes."
   }

   document.querySelector<HTMLDivElement>("#chatWindow")!.appendChild(message);
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

   let selectedCharacter = globalCharacterDictionary.get(selectedCharacterName)!;

   document.querySelector<HTMLInputElement>("#character_name_input")!.value = charName;

   updateRemainingXp();
   document.querySelector<HTMLInputElement>("#total_xp_input")!.valueAsNumber = selectedCharacter.total_xp;

   for (const skillName in selectedCharacter.skills) {
      if (selectedCharacter.skills[skillName] instanceof Skill) {
         displaySkillValue("training", skillName, (selectedCharacter.skills[skillName] as Skill).training);
         displaySkillValue("focus", skillName, (selectedCharacter.skills[skillName] as Skill).focus);
      }
   }

   document.querySelector<HTMLInputElement>("#aqua_hyranis_editor")!.value = selectedCharacter.aqua_ghyranis.toString();

}

function onCharacterSelected(this: HTMLSelectElement) {
   setActiveEditCharacter(this.value);
}

function createCharacter() {
   let newOption: HTMLOptionElement = document.createElement("option");

   let name = prompt("Character Name")!;

   while (globalCharacterDictionary.has(name)) {
      alert("Error: Character already exists.");
      name = prompt("Character Name")!;
   }

   // Character List Update
   globalCharacterDictionary.set(name, new CharacterSheet(name));

   // Character Dropdown
   newOption.value = name;
   newOption.innerText = name;

   let character_list = document.querySelector<HTMLSelectElement>("#character_list_dropdown")!;

   character_list.appendChild(newOption);
   character_list.value = name;

   // Activate Character
   setActiveEditCharacter(name);
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
   }
}

document.querySelector<HTMLSelectElement>("#character_list_dropdown")!.addEventListener("change", onCharacterSelected)
document.querySelector<HTMLButtonElement>("#add_character")!.addEventListener("click", createCharacter)
document.querySelector<HTMLButtonElement>("#remove_character")!.addEventListener("click", deleteCharacter)

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

function setupSkillTable() {
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

setupSkillTable()

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

   console.log(selectedCharacter.attributes)
   selectedCharacter.attributes[name] = value;

   updateRemainingXp();
}

function setBodyValue(this: HTMLInputElement) {
   setAttributeValue("body", +this.value);
}

function setMindValue(this: HTMLInputElement) {
   setAttributeValue("mind", +this.value);
}

function setSoulValue(this: HTMLInputElement) {
   setAttributeValue("soul", +this.value);
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