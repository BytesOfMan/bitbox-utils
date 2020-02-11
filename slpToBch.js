/*
slpToBch.js

A script to send a user-specified slp token to multiple user-defined BCH addresses

Inputs (see `User Input` below)
1) Token ID to send
2) Sending wallet
3) Amount to send to each wallet

Outputs
1) A multi-output SLP transaction sending to all addresses

NOTE: IN TESTING, SLP-SDK FAILS TO SEND CHAINED TRANSACTIONS IN THE FOR LOOP BELOW
HOWEVER THE TRANSACTIONS WILL SEND IF SENT ONE AT A TIME
TRANSACTIONS SOMETIMES TIME OUT
 */

// Import slp-sdk
let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();
// Import keys
const keys = require("./keys");
const sweepableWallets = keys.sweepableWallets;

//User Input
// Token to send
const tokenId = keys.slpTokens.train4;
// Amount to send each BCH address
const slpAmountPerAddr = 1;
// Receiving addresses
const receivingBchAddrs = sweepableWallets;
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

// build receiver addresses, should have limit of 18, but try to break it first
let tokenReceiverAddresses = [];
let slpSendAmounts = [];
//create parent arrays to hold these entries for > 18 outputs
const tokenReceiverAddressesHolder = [];
const slpSendAmountsHolder = [];

for (let i = 0; i < receivingBchAddrs.length; i++) {
  const slpAddr = SLP.Address.toSLPAddress(receivingBchAddrs[i].addr);

  const slpSendAmount = slpAmountPerAddr;
  // Once array has 18 items...
  if (tokenReceiverAddresses.length > 17) {
    tokenReceiverAddressesHolder.push(tokenReceiverAddresses);
    slpSendAmountsHolder.push(slpSendAmounts);
    //reset these arrays to 0
    tokenReceiverAddresses = [];
    slpSendAmounts = [];
  }
  tokenReceiverAddresses.push(slpAddr);
  slpSendAmounts.push(slpSendAmount);
  if (i === receivingBchAddrs.length - 1) {
    tokenReceiverAddressesHolder.push(tokenReceiverAddresses);
    slpSendAmountsHolder.push(slpSendAmounts);
  }
}

// Iterate through the holder arrays to send your multi-output SLP txs
for (let j = 0; j < tokenReceiverAddressesHolder.length; j++) {
  //for (let j = 1; j < 2; j++) {
  //console.log(tokenReceiverAddressesHolder[j]);
  //console.log(slpSendAmountsHolder[j]);
  SLP.TokenType1.send({
    fundingAddress: fundingAddress,
    fundingWif: fundingWif,
    tokenReceiverAddress: tokenReceiverAddressesHolder[j],
    bchChangeReceiverAddress: bchChangeReceiverAddress,
    tokenId: tokenId,
    amount: slpSendAmountsHolder[j]
  }).then(
    result => {
      console.log(`SLP transaction successfully sent!`);
      console.log(`txid: ${result}`);
    },
    err => {
      console.log(`Error in SLP.TokenType1.send:`);
      console.log(err);
      console.log(`tokenReceiverAddress`);
      console.log(tokenReceiverAddressesHolder[j]);
      console.log(`amount`);
      console.log(slpSendAmountsHolder[j]);
    }
  );
}
