/*
decodeRawTx.js

A script to decode a BCH hex raw transaction

Inputs (See `User Input` below)
1) A raw BCH tx in hex, manually specified

Outputs
1) Decoded raw tx
*/

//Import Bitbox
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();

// User Input
// Your raw transaction in hex, to be decoded
const rawTx =
  "02000000014bfe435aa3b53e3228f00230337c4a1624b9ad87ba27c64575b3e92b30bffa71010000006b483045022100c976cadfe9d8748554b3065d11aa43a13253c48423e850ad5e596434c1b6592902202c975bdb40eed94133ca0eb8d1ad701cd2549cc1df5027003f7600641a4c53c2412102c67d9e308a1e3b33f31df398f502bce62c0bdc365d1475ad69b5dabdcb600910ffffffff03f4010000000000001976a914b3dd04259d8c37864f09cda58c02a5d4d1da4eae88ac0000000000000000186a1654657374204f505f52455455524e206d65737361676599830100000000001976a914364b4ef60f6bc6ef2eeb8209771bc3b0886c9cec88ac00000000";

decodeRawTx(rawTx);

async function decodeRawTx(rawTx) {
  try {
    let decodeRawTransaction = await bitbox.RawTransactions.decodeRawTransaction(
      rawTx
    );
    console.log(decodeRawTransaction);
  } catch (error) {
    console.error(error);
  }
}
