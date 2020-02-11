/*
checkSlpBalanceBatch.js

A script to check the balance of a user-specified token ID at an array of SLP addresses

Inputs (see `User Input` below)
1) Array of SLP addresses to check balance at (specified as array of object wallets with key addr, `sweepableWallets`)
2) TokenId of token balance queried, `checkedTokenId`

Outputs
1) Total balance across all addresses of user-specified tokenId

 */

// Import slp-sdk
let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();

// Import keys
const keys = require("./keys");

// User Input
const sweepableWallets = keys.sweepableWallets;
const checkedTokenId = keys.slpTokens.train4;

// Get array of addresses
const fundingAddresses = [];

for (let i = 0; i < sweepableWallets.length; i++) {
  fundingAddress = SLP.Address.toSLPAddress(sweepableWallets[i].addr);

  fundingAddresses.push(fundingAddress);
}

checkBatchBalance(fundingAddresses);

function checkBatchBalance(addrArray) {
  SLP.Utils.balancesForAddress(addrArray).then(
    result => {
      let checkedBalance = 0;
      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result[i].length; j++) {
          if (result[i][j].tokenId === checkedTokenId) {
            console.log(`${addrArray[i]}, ${result[i][j].balance}`);
            checkedBalance += result[i][j].balance;
          }
        }
      }

      console.log(`Total balance for checkedTokenId: ${checkedBalance}`);
    },
    err => {
      console.log(`Error in SLP.Utils.balancesForAddress:`);
      console.log(err);
    }
  );
}
