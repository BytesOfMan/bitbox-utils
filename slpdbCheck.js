/*
slpdbCheck.js

A script to check the total number of addresses and circulating supply of an SLP Token using SLPDB

Compare with apiCheck.js

Inputs
1) Token ID `tokenId`
Outputs
1) Quantity of addresses holding that SLP Token, per SLPDB
2) Circulating supply of that SLP Token, per SLPDB
*/

//Import slp-sdk
let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();

//Import keys
const keys = require("./keys");

//User Input
const tokenId = keys.slpTokens.honk;

SLP.SLPDB.get({
  v: 3,
  q: {
    find: {
      "tokenDetails.tokenIdHex": tokenId,
      token_balance: { $gte: 0 }
    },
    limit: 10000
    //project: { address: 1, satoshis_balance: 1, token_balance: 1, _id: 0 }
  }
}).then(
  res => {
    //console.log(res.a);
    let totalBalance = 0;
    for (let i = 0; i < res.a.length; i++) {
      totalBalance += parseFloat(res.a[i].token_balance);
    }
    console.log(`Eligible holders: ${res.a.length}`);
    console.log(totalBalance);
  },
  err => {
    console.log(`Error!`);
    console.log(err);
  }
);
