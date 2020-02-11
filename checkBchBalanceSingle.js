/*
checkBchBalanceSingle.js

A script to get the BCH balance of a BCH address

Inputs (see `User Input` below)
1) A BCH address manually defined as 'addr'

Outputs:
1) The BCH balance at this address

*/

//Import Bitbox
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();

//Import Keys
const keys = require("./keys");

// Define wallets with relevant addresses
const bchWallet = keys.bchWallet;
const slpWallet = keys.slpWallet;

//User Input
//Define address for balance check
const addr = slpWallet.addr;

checkBalance(addr);

function checkBalance(addr) {
  bitbox.Address.details(addr).then(
    result => {
      //console.log(result);
      console.log(`Balance: ${result.balance} BCH`);
    },
    err => {
      console.log(err);
    }
  );
}
