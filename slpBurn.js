/*
slpBurn.js

A script to burn user-specified SLP Token at a user-specified address

Inputs
1) See '// User Input' section below

Outputs
1) An slp transaction burning the token specified
*/

//Import slp-sdk

let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();

//Import keys
const keys = require("./keys");

// User Input
const burnWallet = keys.slpWallet;
const fundingAddress = burnWallet.addr;
const fundingWif = burnWallet.wif;
const tokenId = keys.slpTokens.train4;
const amount = 38;
const bchChangeReceiverAddress = keys.bchWallet.addr;

SLP.TokenType1.burn({
  fundingAddress,
  fundingWif,
  tokenId,
  amount,
  bchChangeReceiverAddress
}).then(
  res => {
    console.log(`Burn success!`);
    console.log(res);
  },
  err => {
    console.log(`Error in SLP.TokenType1.burn`);
    console.log(err);
  }
);
