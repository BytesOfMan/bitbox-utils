/*
mnemonicToWif.js

A script to convert wallet mnemonics to WIF private key

Inputs (See `User Input`)
1) A mnemonic, manually specified as `mnemonic`
Outputs
2) The WIF for the specified mnemonic

*/

//Import Bitbox
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();
const keys = require("./keys");

// wallet derivation path
const derivePath = keys.derivePath;

//User Input
//Define mnemonic you wish to convert to wif
const mnemonic = keys.slpWallet.mnemonic;
// root seed buffer
const rootSeed = bitbox.Mnemonic.toSeed(mnemonic);
// master HDNode
const masterHDNode = bitbox.HDNode.fromSeed(rootSeed, "bitcoincash");
const childNode = masterHDNode.derivePath(`${derivePath}${0}`);
const wif = bitbox.HDNode.toWIF(childNode);

console.log(`wif:`);
console.log(wif);
