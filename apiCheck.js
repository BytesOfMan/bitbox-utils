/*
apiCheck.js

A script to test total balance and address quantity of an SLP token using the new slp-indexer

Inputs
1) Rest API to use
2) token ID to check

Outputs
1) Number of addresses holding specified Token ID, per specified Rest API
2) Total circulating supply of specified Token ID, per specified Rest API

Compare to slpdbCheck.js
*/

const keys = require("./keys");

const tokenId = keys.slpTokens.honk;

const oldRest = "https://rest.bitcoin.com/v2/slp/balancesForToken/";
const newRest = "https://slp.api.wallet.bitcoin.com/v2/slp/balancesForToken/";

const rp = require("request-promise");
rp({
  uri: `${newRest}${tokenId}`,
  json: true
}).then(
  res => {
    console.log(`Success!`);
    let totalBalance = 0;
    // sort by address
    /*
    res.sort((a, b) =>
      a.slpAddress > b.slpAddress ? 1 : b.slpAddress > a.slpAddress ? -1 : 0
    );
    */
    // sort by balance
    res.sort((a, b) =>
      a.tokenBalance > b.tokenBalance
        ? 1
        : b.tokenBalance > a.tokenBalance
        ? -1
        : 0
    );
    for (let i = 0; i < res.length; i++) {
      console.log(`${res[i].slpAddress}, ${res[i].tokenBalance}`);
      totalBalance += res[i].tokenBalance;
    }
    console.log(`Results from API:`);
    console.log(`Eligible holders: ${res.length}`);
    console.log(totalBalance);
  },
  err => {
    console.log(`Error:`);
    console.log(err);
  }
);
