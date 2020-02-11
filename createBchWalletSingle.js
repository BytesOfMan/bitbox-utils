/*
createBchWalletSingle.js

A script to create a new BCH wallet (12-word mnemonic and address)

Inputs:
None

Outputs:
1) Randomly generated BCH wallet with mnemonic and address
*/

//Import Bitbox
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();

let mnemonic = bitbox.Mnemonic.generate();

// root seed buffer
let rootSeed = bitbox.Mnemonic.toSeed(mnemonic);

// master HDNode
let masterHDNode = bitbox.HDNode.fromSeed(rootSeed, "bitcoincash");

// HDNode of BIP44 account
let account = bitbox.HDNode.derivePath(masterHDNode, "m/44'/145'/0'");

// derive the first external change address HDNode which is going to spend utxo
let change = bitbox.HDNode.derivePath(account, "0/0");

// get the cash address
let cashAddress = bitbox.HDNode.toCashAddress(change);

console.log(`Seed and Address:`);
console.log(mnemonic);
console.log(cashAddress);
