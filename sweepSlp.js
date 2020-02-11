/*
sweepSlp.js

A script to sweep all of a user-specified slp token ID from multiple addresses and return to 1 receiving address
Script implements an SLP from many to one transaction

Inputs
1)See 'User Input' below
Outputs
1)A broadcast tx returning all of specified SLP token id to single address
*/

//Import slp-sdk
let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();

//Import keys
const keys = require("./keys");
const slpWallet = keys.slpWallet;

// User Input
const sweepableWallets = keys.sweepableWallets;
const tokenReceiverAddress = slpWallet.addr;
const tokenId = keys.slpTokens.train4;
const bchChangeReceiverAddress = slpWallet.bchChangeReceiverAddr;

// build array of fundingAddresses
// build array of fundingWifs

const fundingAddresses = [];
const fundingWifs = [];

for (let i = 0; i < sweepableWallets.length; i++) {
  fundingAddress = SLP.Address.toSLPAddress(sweepableWallets[i].addr);
  fundingWif = sweepableWallets[i].wif;
  fundingAddresses.push(fundingAddress);
  fundingWifs.push(fundingWif);
}
//console.log(fundingAddresses);
//console.log(fundingWifs);

// Check balance for token type across all input addresses
SLP.Utils.balancesForAddress(fundingAddresses).then(
  result => {
    //console.log(`balancesForAddress:`);
    //console.log(`All token balances for addresses:`);
    //console.log(JSON.stringify(result, null, 2));
    // Parse for tokenId

    let checkedBalance = 0;
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result[i].length; j++) {
        if (result[i][j].tokenId === keys.slpTokens.train4) {
          checkedBalance += result[i][j].balance;
        }
      }
    }

    console.log(`Total balance for TRAIN4: ${checkedBalance}`);
    return sweepAllSlp(checkedBalance);
  },
  err => {
    console.log(`Error in SLP.Utils.balancesForAddress:`);
    console.log(err);
  }
);

function sweepAllSlp(checkedBalance) {
  SLP.TokenType1.send({
    fundingAddress: fundingAddresses,
    fundingWif: fundingWifs,
    tokenReceiverAddress: tokenReceiverAddress,
    bchChangeReceiverAddress: bchChangeReceiverAddress,
    tokenId: tokenId,
    amount: checkedBalance
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
}
