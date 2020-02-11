/*
createBchWalletsBatch.js

A script to create a collection of BCH wallets, for example to test an SLP dividend payment

Inputs (see `User Input` below)
1) Derivation path defined in keys.js
2) Number of wallets to generate

Outputs:
1) An array of walletCount objects in {addr: '', wif: ''} format

*/

// Easiest batch sweeping enabled by creating all wallets from an HD wallet and 1 mnemonic

// Import Bitbox
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();

// Import keys
const keys = require("./keys");

// User Input
// wallet derivation path
const derivePath = keys.derivePath;
// How many sweepable BCH addresses do you want to create?
const walletCount = 20;

// Create an HD wallet
const entropy = bitbox.Crypto.randomBytes(16);
// turn entropy to 12 word mnemonic
const mnemonic = bitbox.Mnemonic.fromEntropy(entropy);
// root seed buffer
const rootSeed = bitbox.Mnemonic.toSeed(mnemonic);
// master HDNode
const masterHDNode = bitbox.HDNode.fromSeed(rootSeed, "bitcoincash");

// Create your sweepable BCH wallets
const sweepableWallets = [];
for (let i = 0; i < walletCount; i++) {
  const sweepableWallet = {};
  const childNode = masterHDNode.derivePath(`${derivePath}${i}`);
  const address = bitbox.HDNode.toCashAddress(childNode);
  const wif = bitbox.HDNode.toWIF(childNode);
  // console.log(`${derivePath}${i}: ${potentialTipAddress}`);

  sweepableWallet.addr = address;
  sweepableWallet.wif = wif;
  sweepableWallets.push(sweepableWallet);
}

console.log(sweepableWallets);
