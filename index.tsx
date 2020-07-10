import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { startPhysics } from "./src/physics";

let elem = document.getElementById("draw-animation");

let width = window.innerWidth;
let height = window.innerHeight;
window.width = width;
window.height = height;

let text = `Motion is a state, which indicates change of position. Surprisingly, everything in this world is constantly
moving and nothing is stationary. The apparent state of rest, as we shall learn, is a notional experience
conned to a particular system of reference. A building, for example, is at rest in Earth's reference, but it
is a moving body for other moving systems like train, motor, airplane, moon, sun etc.`;
let words = text.split(/(\s+)/).filter(w => w.trim().length > 0);

// let connections = [c1, c2];
let box = document.getElementById("draw-animation");
let { addWord, removeWord } = startPhysics(box);

addWord("type");
addWord(" ");

// words.slice(0, 10).map(addWord);
window.addEventListener("keypress", (ev: KeyboardEvent) => {
  let str = ev.key;
  if (ev.key == "Enter") {
    str = " ";
  }
  addWord(str);
});

window.addEventListener("keydown", (ev: KeyboardEvent) => {
  if (ev.keyCode === 8 || ev.keyCode == 46) {
    let selection = window.getSelection();
    // console.log(selection);
    let words = Array.from(document.querySelectorAll("text"));
    // console.log(words);
    words = words.filter(t => selection.containsNode(t));
    console.log(words.length);
    words.forEach(removeWord);
    removeWord();

    if (window.getSelection) {
      if (window.getSelection().empty) {
        // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        // Firefox
        window.getSelection().removeAllRanges();
      }
    }
    // console.log(words);
  }
});

function formatWords(words: Array<string>) {
  return `<p class="word-bank">${words
    .map(w => `<span class="word-span">${w}</span>&nbsp;`)
    .join(" ")}</p>`;
}

let destinationWords: Array<string> = [];
