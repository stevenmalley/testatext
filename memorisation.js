let textData = [];

class LineData {
  static latestID = 0; // Stores count of number of instances created
  
  constructor(string) {
    this.id = ++LineData.latestID;
    this.p = create("p", {id:"textLine"+this.id, className:"textLine hidden"}, "textDisplay");
    this.revealedText = create("span", {className:"textSpan"}, this.p);
    this.hiddenText = create("span", {textContent:string}, this.p);
    this.exposed = false; // has the whole p element been revealed (exposed once the span element is empty)

    this.hiddenWordSpans();

    // on clicking a revealed word, hide it and all subsequent words
    this.revealedText.addEventListener("click", () => {
      let selection = window.getSelection();
      let character = selection.anchorOffset;
      while (character > 0 && this.revealedText.textContent[character-1] !== " ") {
        // reverse to the previous space (or beginning of line) to capture the whole word
        character--;
      }
      this.hiddenText.textContent = this.revealedText.textContent.slice(character) + this.hiddenText.textContent;
      this.revealedText.textContent = this.revealedText.textContent.slice(0,character);
      this.exposed = false;
      this.p.classList.add("hidden");
      hideLinesAfter(this.id);
      this.hiddenWordSpans();
    });

    // on clicking a hidden word, reveal it and all previous words
    this.hiddenText.addEventListener("click", e => {
      revealLinesBefore(this.id);

      const target = (e.target.classList.contains("initial")) ? e.target.parentElement : e.target;
      if (target["data-spanCount"]) {
        let spans = target["data-spanCount"];
        while (spans-- > 0) {
          this.revealedText.textContent = this.revealedText.textContent + this.hiddenText.firstChild.textContent;
          this.hiddenText.removeChild(this.hiddenText.firstChild);
        }
        if (this.hiddenText.firstChild && this.hiddenText.firstChild.textContent === " ") {
          // if the next span holds a space, reveal it as well, so that the revealedText ends with a space (so that the next hidden word span will hold an .initial span)
          this.revealedText.textContent = this.revealedText.textContent + this.hiddenText.firstChild.textContent;
          this.hiddenText.removeChild(this.hiddenText.firstChild);
        }
        this.checkLineRevealed();
      } else {
        this.revealLine();
      }
      this.hiddenWordSpans();
      this.scrollIntoView();
    });
    
    // on clicking a hidden line, reveal it and all previous lines
    this.p.addEventListener("click", e => {
      if (e.target.tagName === "P") { // only count clicks on the P outside of the spans
        if (this.exposed) {
          hideLinesAfter(this.id);
        } else {
          revealLinesUpTo(this.id);
        }
      }
    });
  }

  checkLineRevealed() {
    if (this.hiddenText.textContent.length === 0 || this.hiddenText.textContent.split("").every(c => c === " ")) {
      // if there are no non-space characters left in the line, expose it
      this.exposed = true;
      this.p.classList.remove("hidden");
    }
  }

  hiddenWordSpans() {
    // for the hiddenText, put every word in a separate span with its initial in an .initial child span
    
    // first letter in hiddenText is initial if revealedText has no letters after its final space (or no letters at all)
    let revealedArray = this.revealedText.textContent.split("");
    let firstLetterIsInitial = revealedArray.findLastIndex(c => c.match(/[a-zA-Z0-9]/)) <= revealedArray.lastIndexOf(" ");

    let hiddenString = this.hiddenText.textContent;
    this.hiddenText.textContent = "";

    let currentWordStart = -1;
    let i = 0;
    let spanCount = 0;
    for (let c of hiddenString) {
      if (c === " " || i === hiddenString.length-1) {
        // reached a space or last character of the line, write the previous word

        if (i === hiddenString.length-1 && c !== " ") {
          // reached the last character of the line (and it is not a space), set word range variables
          if (currentWordStart === -1) currentWordStart = i;
          i++;
        }

        if (currentWordStart !== -1) {
          // if there is a word, write it to a .hidden span
          // include the initial in an .initial span
          const wordSpan = create("span",{className:"textSpan hidden","data-spanCount":++spanCount},this.hiddenText);
          let hiddenWord = hiddenString.slice(currentWordStart,i);
          if (firstLetterIsInitial) {
            let initialIndex = 0;
            let firstAlphanumeric = hiddenWord.match(/[a-zA-Z1-9]/);
            if (firstAlphanumeric) initialIndex = firstAlphanumeric.index;
            wordSpan.appendChild(document.createTextNode(hiddenWord.slice(0,initialIndex)));
            wordSpan.appendChild(create("span",{className:"textSpan hidden initial",textContent:hiddenWord[initialIndex]}));
            wordSpan.appendChild(document.createTextNode(hiddenWord.slice(initialIndex+1)));
          } else {
            wordSpan.appendChild(document.createTextNode(hiddenWord));
          }

          // all spans after the first will have initials as first letter
          firstLetterIsInitial = true;

          // reset the starting range variable, ready to search for the next word
          currentWordStart = -1;
        }

        // create a .space span if the character is a space
        if (c === " ") create("span",{className:"textSpan space",textContent:" ","data-spanCount":++spanCount},this.hiddenText);

      } else {
        // if encountering the beginning of a new word, set its starting range variable
        if (currentWordStart === -1) currentWordStart = i;
      }
      i++;
    }
  }

  revealCharacter() {
    // reveals a character and exposes the line if the final character is revealed
    const c = this.hiddenText.textContent[0];
    this.revealedText.textContent += c;
    this.hiddenText.textContent = this.hiddenText.textContent.slice(1);

    this.checkLineRevealed();

    this.hiddenWordSpans();

    return c;
  }

  revealLetter() {
    // reveal a letter and any special characters that follow
    this.scrollIntoView();

    let letterRevealed = false; // flag set once a letter has been revealed (so that, if the next character to be revealed is special, keep going until reaching a letter)
    do {
      const c = this.revealCharacter();
      if (c.match(/[a-zA-Z0-9]/)) letterRevealed = true;
    } while (!this.exposed && (!letterRevealed || (this.hiddenText.textContent[0] !== " " && !this.hiddenText.textContent[0].match(/[a-zA-Z0-9]/))));
    if (!this.exposed && this.hiddenText.textContent[0] === " ") this.revealCharacter();
  }

  revealWord() {
    // reveal a word (including any non-space special characters) and the following space
    this.scrollIntoView();
    
    let letterRevealed = false; // flag set once a letter has been revealed (so that, if the next character to be revealed is special, keep going until reaching a letter)
    do {
      const c = this.revealCharacter();
      if (c !== " ") letterRevealed = true;
    } while (!this.exposed && (!letterRevealed || this.hiddenText.textContent[0] !== " "));
    if (!this.exposed && this.hiddenText.textContent[0] === " ") this.revealCharacter();
  }
  
  revealLine(scroll = true) {
    if (scroll) this.scrollIntoView();
    
    while (!this.exposed) {
      this.revealCharacter();
    }
  }

  hideLine() {
    this.exposed = false;
    this.p.classList.add("hidden");
    this.hiddenText.textContent = this.revealedText.textContent + this.hiddenText.textContent;
    this.revealedText.textContent = "";
    this.hiddenWordSpans();
  }

  scrollIntoView() {
    let rect = this.p.getBoundingClientRect();
    if (rect.top < 0) {
      console.log("scrolling up: "+rect.top);
      scroll(window.scrollX, (window.scrollY-5) + rect.top);
    } else {
      let bottomBarTop = elid("bottomBar").getBoundingClientRect().top;
      console.log("scrolling down: "+rect.bottom+", "+bottomBarTop);
      if (bottomBarTop < rect.bottom) {
        scroll(window.scrollX, (window.scrollY+5) + (rect.bottom-bottomBarTop));
      }
    }
  }
}

function hideLinesAfter(id) {
  textData.forEach(line => {
    if (line.id > id) line.hideLine();
  });
}

function revealLinesBefore(id) {
  textData.forEach(line => {
    if (!line.exposed && line.id < id) line.revealLine(false);
  });
}

function revealLinesUpTo(id) {
  textData.forEach(line => {
    if (!line.exposed && line.id <= id) line.revealLine(false);
  });
}





function setCharactersRemaining() {
  let remaining = 5000 - elid("textInput").value.length;
  elid("charactersRemaining").textContent = remaining + " characters remaining";
}

  
function memorise() {
  textData = [];
  
  elid("textDisplay").replaceChildren();

  let input = elid("textInput").value;

  if (input.length === 0) {
    alert("Type some text to memorise in the box. Linebreaks will be helpful.");
    elid("textInput").focus();
  } else if (input.length > 5000) alert("Exceeds maximum text length of 5000 characters.");
  else {

    input = input.replace(/\r/g, '\n');
    let lineArray = input.split("\n");

    lineArray.forEach(line => {
      if (line.length > 0) {
        textData.push(new LineData(line));
      }
    });

    elid("textInputSection").style.display = "none";
    elid("memorisationSection").style.display = "block";
    document.body.addEventListener("keypress", keypressHandler);
  }
}
function edit() {
  textData = [];

  elid("textDisplay").replaceChildren();

  setCharactersRemaining();
  elid("textInputSection").style.display = "block";
  elid("memorisationSection").style.display = "none";
  document.body.removeEventListener("keypress", keypressHandler);

  elid("textInput").focus();
}


function activeLine() {
  return textData.find(line => !line.exposed);
}


function showOptions() {
  elid("optionsContainer").style.display = "block";
}
function hideOptions() {
  elid("optionsContainer").style.display = "none";
}


function keypressHandler(e) {
  e.preventDefault();
  let buttonTriggered;
  switch (e.code) {
    case 'KeyZ' : revealSection("letter"); buttonTriggered = elid("revealLetter"); break;
    case 'KeyX' : revealSection("word"); buttonTriggered = elid("revealWord"); break;
    case 'KeyC' : revealSection("line"); buttonTriggered = elid("revealLine"); break;
    case 'KeyE' : edit(); break;
  }
  if (buttonTriggered) {
    buttonTriggered.classList.add("activatedButton");
    setTimeout(()=>buttonTriggered.classList.remove("activatedButton"),100);
  }
}

function revealSection(type) {
  const line = activeLine();
  if (line) {
    switch (type) {
      case "letter" : line.revealLetter(); break;
      case "word" : line.revealWord(); break;
      case "line" : line.revealLine(); break;
    }
  }
}


function localSave() {
  const savedTexts = localStorage.getItem("savedTexts");
  const textArray = savedTexts? JSON.parse(savedTexts) : [];
  textArray.push(elid("textInput").value);
  localStorage.setItem("savedTexts",JSON.stringify(textArray));

  createSavedTextButtons();
}

function createSavedTextButtons() {
  elid("localTexts").replaceChildren();
  let savedTexts = localStorage.getItem("savedTexts");
  if (savedTexts) {
    let textArray = JSON.parse(savedTexts);
    textArray.forEach((text,i) => {
      const textDiv = create("div",{},"localTexts");
      create("button", {onclick: () => deleteLocalText(i), className: "deleteButton", innerHTML: trashSVG}, textDiv);
      create("button",{onclick: () => loadLocalText(text), className: "loadButton", textContent: text.slice(0,30)+"..."},textDiv);
    });
    elid("localTextsInfo").style.display = (textArray.length > 0)? "block" : "none";
  }
}

function loadLocalText(text) {
  elid("textInput").value = text;
  setCharactersRemaining();
}

function deleteLocalText(i) {
  let savedTexts = JSON.parse(localStorage.getItem("savedTexts"));
  savedTexts.splice(i,1);
  localStorage.setItem("savedTexts",JSON.stringify(savedTexts));
  createSavedTextButtons();
}

function clearText() {
  elid("textInput").value = "";
  setCharactersRemaining();
}


const trashSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
  <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
</svg>`;


elid("textInput").oninput = setCharactersRemaining;
elid("textInputSubmit").onclick = memorise;
elid("textLocalSave").onclick = localSave;
elid("clearText").onclick = clearText;

elid("changeText").onclick = edit;
elid("options").onclick = showOptions;
elid("closeOptionsWindow").onclick = hideOptions;


elid("revealLetter").onclick = () => revealSection("letter");
elid("revealWord").onclick = () => revealSection("word");
elid("revealLine").onclick = () => revealSection("line");



/* option dependency:
  showWordLengths requires showLineLengths
  revealInitials requires showWordLengths and showLineLengths
*/
elid("optionRevealLineLengths").onchange = () => {
  if (elid("optionRevealLineLengths").checked) {
    elid("memorisationSection").classList.add("showLineLengths");
  } else {
    elid("memorisationSection").classList.remove("showLineLengths");
    elid("optionRevealWordLengths").checked = false;
    elid("memorisationSection").classList.remove("showWordLengths");
    elid("optionRevealInitials").checked = false;
    elid("memorisationSection").classList.remove("revealInitials");
  }
};
elid("optionRevealWordLengths").onchange = () => {
  if (elid("optionRevealWordLengths").checked) {
    elid("memorisationSection").classList.add("showWordLengths");
    elid("optionRevealLineLengths").checked = true;
    elid("memorisationSection").classList.add("showLineLengths");
  } else {
    elid("memorisationSection").classList.remove("showWordLengths");
    elid("optionRevealInitials").checked = false;
    elid("memorisationSection").classList.remove("revealInitials");
  }
};
elid("optionRevealInitials").onchange = () => {
  if (elid("optionRevealInitials").checked) {
    elid("memorisationSection").classList.add("revealInitials");
    elid("optionRevealLineLengths").checked = true;
    elid("memorisationSection").classList.add("showLineLengths");
    elid("optionRevealWordLengths").checked = true;
    elid("memorisationSection").classList.add("showWordLengths");
  } else {
    elid("memorisationSection").classList.remove("revealInitials");
  }
};




setCharactersRemaining();
createSavedTextButtons();





// TESTING
const strangeMeeting = `It seemed that out of battle I escaped
Down some profound dull tunnel, long since scooped
Through granites which titanic wars had groined.

Yet also there encumbered sleepers groaned,
Too fast in thought or death to be bestirred.
Then, as I probed them, one sprang up, and stared
With piteous recognition in fixed eyes,
Lifting distressful hands, as if to bless.
And by his smile, I knew that sullen hall,— 
By his dead smile I knew we stood in Hell.

With a thousand fears that vision's face was grained;
Yet no blood reached there from the upper ground,
And no guns thumped, or down the flues made moan.
“Strange friend,” I said, “here is no cause to mourn.” 
“None,” said that other, “save the undone years,
The hopelessness. Whatever hope is yours,
Was my life also; I went hunting wild
After the wildest beauty in the world,
Which lies not calm in eyes, or braided hair,
But mocks the steady running of the hour,
And if it grieves, grieves richlier than here.
For by my glee might many men have laughed,
And of my weeping something had been left,
Which must die now. I mean the truth untold,
The pity of war, the pity war distilled.
Now men will go content with what we spoiled.
Or, discontent, boil bloody, and be spilled.
They will be swift with swiftness of the tigress. 
None will break ranks, though nations trek from progress.
Courage was mine, and I had mystery;
Wisdom was mine, and I had mastery: 
To miss the march of this retreating world
Into vain citadels that are not walled.
Then, when much blood had clogged their chariot-wheels, 
I would go up and wash them from sweet wells,
Even with truths that lie too deep for taint.
I would have poured my spirit without stint
But not through wounds; not on the cess of war.
Foreheads of men have bled where no wounds were.

“I am the enemy you killed, my friend.
I knew you in this dark: for so you frowned
Yesterday through me as you jabbed and killed.
I parried; but my hands were loath and cold.
Let us sleep now. . . .”`;

// elid("textInput").value = strangeMeeting; memorise();