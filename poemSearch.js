function closePoemSearchWindow() {
  elid("poemSearchWindow").style.display = "none";
}


async function poetrySearch(e) {
  e.preventDefault();

  elid("poemSearchResults").textContent = "searching...";


  const author = elid("poemSearch-author").value.slice(0,100);
  const title = elid("poemSearch-title").value.slice(0,100);

  let parameters = [];
  let terms = [];

  if (author) {
    parameters.push("author");
    terms.push(author);
  }
  if (title) {
    parameters.push("title");
    terms.push(title);
  }

  if (author || title) {
    const searchURL = "https://poetrydb.org/" + parameters.join(",") + "/" + terms.join(";");

    console.log(searchURL);

    const response = await fetch(searchURL);

    console.log(response);

    if (response) {
      const responseJSON = await response.json();

      console.log(responseJSON);

      if (responseJSON instanceof Array && responseJSON.length > 0) {
        createPoemButtons(responseJSON);
      } else {
        elid("poemSearchResults").textContent = "no results found";
      }
    } else {
      elid("poemSearchResults").textContent = "no response from server, please try again later";
    }
  } else {
    elid("poemSearchResults").textContent = "search for either an author, any words from a title, or both";
  }
}

function createPoemButtons(poemResults) {
  const results = elid("poemSearchResults");
  results.replaceChildren();

  poemResults.forEach(poem => {
    let poemButton = create("button", {
      textContent: poem.title,
      className: "loadPoemButton",
      onclick: () => {
        elid("textInput").value = poem.lines.join("\n");
        setCharactersRemaining();
        closePoemSearchWindow();
      }
    }, results);

    create("strong", {textContent: " "+poem.author}, poemButton);
  });
}



elid("activatePoemSearch").onclick = () => {
  elid("poemSearchWindow").style.display = "block";
};

elid("poemSearch").onclick = poetrySearch;

elid("poemSearchClose").onclick = closePoemSearchWindow;