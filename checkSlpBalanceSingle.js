/*
checkSlpBalanceSingle.js

A script to check the balance of a user-specified token ID at a single SLP address

Inputs (See `User Input` below)
1) SLP address to check balance at 
2) TokenId of token balance queried

Outputs
1) Total balance at 1 address of user-specified tokenId

 */

// Import slp-sdk
let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();

// Import keys
const keys = require("./keys");

// User Input
let slpCheckAddr = keys.slpReceivers.self;
let checkedTokenId = keys.slpTokens.train4;

checkBalance(slpCheckAddr);

function checkBalance(slpCheckAddr) {
  SLP.Utils.balancesForAddress(slpCheckAddr).then(
    result => {
      //console.log(`balancesForAddress:`)
      //console.log(`All token balances for address ${slpCheckAddr}:`);
      //console.log(JSON.stringify(result, null, 2));
      // Parse for checkedTokenId
      let checkedBalance = 0;
      for (let i = 0; i < result.length; i++) {
        if (result[i].tokenId === checkedTokenId) {
          checkedBalance += result[i].balance;
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
