let fs = require("fs");
let _ = require("lodash");
let str = fs
  .readFileSync("english_bigrams.txt")
  .toString()
  .trim();

let monograms = {
  A: 8.55,
  K: 0.81,
  U: 2.68,
  B: 1.6,
  L: 4.21,
  V: 1.06,
  C: 3.16,
  M: 2.53,
  W: 1.83,
  D: 3.87,
  N: 7.17,
  X: 0.19,
  E: 12.1,
  O: 7.47,
  Y: 1.72,
  F: 2.18,
  P: 2.07,
  Z: 0.11,
  G: 2.09,
  Q: 0.1,
  H: 4.96,
  R: 6.33,
  I: 7.33,
  S: 6.73,
  J: 0.22,
  T: 8.94
};

let dict = {};
let data = str
  .split("\n")
  .map(r => r.split(" "))
  .map(([a, b]) => {
    return [
      a,
      Math.round(
        parseInt(b, 10) / (10000 * (monograms[a[0]] + monograms[a[1]]))
      )
    ];
  })
  .forEach(([a, b]) => {
    dict[a] = b;
  });

// let groups = _.groupBy(data, ({ bigram }) => bigram[0]);
console.log(dict);
fs.writeFileSync("src/bigrams.ts", `export default ${JSON.stringify(dict)}`);
// console.log(groups);
