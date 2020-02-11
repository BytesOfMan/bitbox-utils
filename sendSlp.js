/*
sendSlp.js

A script to send user-specified amounts of user-specifed SLP tokens to a user-specified address

Inputs (See `User Input`)
1) Sending wallet specified by `mnemonic`
2) Sending amount specified by `slpSendAmount`
3) Sending token id specified by `tokenId`
4) Receiving SLP address specified by `tokenReceiverAddress`

Outputs
1) A broadcast SLP transaction matching the above parameters
*/

let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();
const keys = require("./keys");
const wallet = keys.mintWallet;
const sweepableWallets = keys.sweepableWallets;

// User Input
// Token to send
const tokenId = keys.slpTokens.train4;
// Amount to send
const slpSendAmount = 999999;
// Receiving address
const tokenReceiverAddress = wallet.addr;
// SLP sending wallet
const mnemonic = keys.slpWallet.mnemonic;

// create seed buffer from mnemonic
const seedBuffer = SLP.Mnemonic.toSeed(mnemonic);
// create HDNode from seed buffer
const hdNode = SLP.HDNode.fromSeed(seedBuffer);
// Generate your change address
const fundingAddress = SLP.HDNode.toSLPAddress(hdNode);
// to WIF
const fundingWif = SLP.HDNode.toWIF(hdNode);
// to cash address
let bchChangeReceiverAddress = SLP.HDNode.toCashAddress(hdNode);

SLP.TokenType1.send({
  fundingAddress,
  fundingWif,
  tokenReceiverAddress,
  bchChangeReceiverAddress,
  tokenId,
  amount: slpSendAmount
}).then(
  result => {
    console.log(`SLP transaction successfully sent!`);
    console.log(`txid: ${result}`);
  },
  err => {
    console.log(`Error in SLP.TokenType1.send:`);
    console.log(err);
    console.log(`tokenReceiverAddress`);
    console.log(tokenReceiverAddresses);
    console.log(`amount`);
    console.log(slpSendAmount);
  }
);
