/* DEPENDENCY: memorisation.js (for textInputLimit) */


function openLyricsSearchWindow() {
  elid("textInputSection").classList.add("showLyricsSearch");
  elid("lyricsSearchResults").textContent = "";
}
function closeLyricsSearchWindow() {
  elid("textInputSection").classList.remove("showLyricsSearch");
}


async function lyricsSearch(e) {
  e.preventDefault();

  elid("lyricsSearchResults").textContent = "searching...";


  const artist = elid("lyricsSearch-artist").value.slice(0,100).trim();
  const title = elid("lyricsSearch-title").value.slice(0,100).trim();

  let searchURL = "https://lyrist.vercel.app/api/";

  if (title) {

    searchURL += encodeURIComponent(title);

    if (artist) {
      searchURL += "/"+encodeURIComponent(artist);
    }

    console.log(searchURL);

    const response = await fetch(searchURL);

    console.log(response);

    if (response) {
      const responseJSON = await response.json();

      console.log(responseJSON);

      if (responseJSON.lyrics) {
        let heading = "";
        if (responseJSON.title || responseJSON.artist) {
          heading = '*' + [responseJSON.title,responseJSON.artist].join(", ") + '*\n\n';
        }

        elid("textInput").value = (heading+responseJSON.lyrics.replaceAll(/\[.*\]\n/g,"")).slice(0,textInputLimit);
        inputUpdate();
        closeLyricsSearchWindow();
        elid("textInput").scroll(0,0);
        
      } else {
        elid("lyricsSearchResults").textContent = "no results found";
      }
    } else {
      elid("lyricsSearchResults").textContent = "no response from server, please try again later";
    }
  } else {
    elid("lyricsSearchResults").textContent = "please provide the title of a song";
  }
}



elid("activateLyricsSearch").onclick = openLyricsSearchWindow;

elid("lyricsSearch").onclick = lyricsSearch;

elid("lyricsSearchClose").onclick = closeLyricsSearchWindow;