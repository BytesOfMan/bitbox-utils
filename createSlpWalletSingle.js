/*
createSlpWalletSingle.js

A script to create a new SLP wallet (12-word mnemonic and receiving address)

*/

// Import slp-sdk
let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();

// generate entropy for a 12-word mnemonic
let entropy = SLP.Crypto.randomBytes(16);
// create mnemonic from entropy
let mnemonic = SLP.Mnemonic.fromEntropy(entropy);
// create seed buffer from mnemonic
let seedBuffer = SLP.Mnemonic.toSeed(mnemonic);
// create HDNode from seed buffer
let hdNode = SLP.HDNode.fromSeed(seedBuffer);
// Generate your receiving address
let slpAddr = SLP.HDNode.toSLPAddress(hdNode);

console.log(`Mnemonic:`);
console.log(mnemonic);
console.log(`SLP address:`);
console.log(slpAddr);
