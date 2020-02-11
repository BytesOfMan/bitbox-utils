/*
checkBchBalanceBatch.js

A script to get the total BCH balance of a batch of BCH addresses

Inputs:
1) An Array of objects each with an `addr` key defining a cashAddr

Outputs:
1) Total BCH balance of all addresses

*/

// Import Bitbox
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();

// Import keys
const keys = require("./keys");

// Define batch wallet
const sweepableWallets = keys.sweepableWallets;

// Build addrArray for batch balance
batchAddresses = [];
for (let i = 0; i < sweepableWallets.length; i++) {
  batchAddresses.push(sweepableWallets[i].addr);
}

checkBatchBalance(batchAddresses);

function checkBatchBalance(addrArray) {
  bitbox.Address.details(addrArray).then(
    result => {
      //console.log(result);
      for (let i = 0; i < result.length; i++) {
        console.log(`${addrArray[i]}: ${result[i].balance} BCH`);
      }
    },
    err => {
      console.log(err);
    }
  );
}
