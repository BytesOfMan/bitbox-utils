/*
Test script for preparing slp utxos for dividend payment

Approach: Send SLP transactions to specific address to create multiple utxos according earlier spec

Status: Unfinished, after review, slp-sdk will not be sufficient to do this out of the box
_ Will require specific utxo selection

Inputs (See `User Input` below)
1) Token ID of SLP token to send, manually specified as `tokenId`
2) Amount of SLP token to send, manually specified as `amount`
3) An SLP wallet mnemonic, manually specified as `mnemonic`

Outputs:
1) A broadcast txid of an SLP transaction as defined by the inputs above
(Note: this script is a stub and does not currently prepare an SLP dividend payment)
*/

//Import slp-sdk
let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();
// Import keys
const keys = require("./keys");

// User Input
// Token to send
let tokenId = keys.slpTokens.train4;
// Amount to send
let amount = 1;
// Address to send SLP to
let tokenReceiverAddress = keys.slpReceivers.self;
let mnemonic = keys.slpWallet.mnemonic;

// create seed buffer from mnemonic
let seedBuffer = SLP.Mnemonic.toSeed(mnemonic);
// create HDNode from seed buffer
let hdNode = SLP.HDNode.fromSeed(seedBuffer);
// Generate your receiving address
let fundingAddress = SLP.HDNode.toSLPAddress(hdNode);
// to WIF
let fundingWif = SLP.HDNode.toWIF(hdNode);
// to cash address
let bchChangeReceiverAddress = SLP.HDNode.toCashAddress(hdNode);
console.log(`fundingAddress: ${fundingAddress}`);

SLP.TokenType1.send({
  fundingAddress: fundingAddress,
  fundingWif: fundingWif,
  tokenReceiverAddress: tokenReceiverAddress,
  bchChangeReceiverAddress: bchChangeReceiverAddress,
  tokenId: tokenId,
  amount: amount
}).then(
  result => {
    console.log(`SLP transaction successfully sent!`);
    console.log(`txid: ${result}`);
  },
  err => {
    console.log(`Error in SLP.TokenType1.send:`);
    console.log(err);
  }
);
