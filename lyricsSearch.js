/* DEPENDENCY: memorisation.js (for textInputLimit) */


function openLyricsSearchWindow() {
  elid("textInputSection").classList.add("showLyricsSearch");
  elid("lyricsSearch-query").value = "";
  elid("lyricsSearch-query").focus();
  elid("lyricsSearchResults").textContent = "";
}
function closeLyricsSearchWindow() {
  elid("textInputSection").classList.remove("showLyricsSearch");
}


async function lyricsSearch(e) {
  e.preventDefault();

  elid("lyricsSearchResults").textContent = "searching...";


  const query = encodeURIComponent(elid("lyricsSearch-query").value.slice(0,100).trim());
  

  if (query) {
    let formData = new FormData();
    formData.append("q",query);

    const response = await fetch("./getLyrics.php",{
      method: "POST",
      body: formData
    });

    if (response) {
      const responseText = await response.text();
      console.log(responseText);
      const responseJSON = JSON.parse(responseText);
      //const responseJSON = await response.json();

      console.log(responseJSON);

      if (responseJSON.status === "success") {
        let heading = "";
        if (responseJSON.title) {
          heading = `*${responseJSON.title}*\n\n`;
        }

        elid("textInput").value = (heading+responseJSON.lyrics.trim()).slice(0,textInputLimit);//(heading+responseJSON.lyrics.trim().replaceAll(/\[.*\]\n/g,"")).slice(0,textInputLimit);
        inputUpdate();
        closeLyricsSearchWindow();
        elid("textInput").scroll(0,0);
        
      } else {
        elid("lyricsSearchResults").textContent = responseJSON.error || "no results found";
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