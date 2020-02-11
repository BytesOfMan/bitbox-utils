/*
sweepAll.js

A script to sweep all BCH from multiple addresses and send it to a single BCH address
WARNING: THIS SCRIPT WILL BURN SLP TOKENS AT SWEPT ADDRESSES

Inputs (See 'User Input' below)
1) Array of BCH Wifs
2) Receiving address, `sweepToAddress`
3) Flag var realMoney
Outputs
1) If realMoney = true, a broadcast BCH transaction sweeping full balance of all BCH wifs and returning to  sweepToAddress
2) If realMoney = false, a rawtx in hex logged to console
*/

//Import Bitbox

let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();
const keys = require("./keys");

// User Input
const sweepableWallets = keys.sweepableWallets;
const sweepToAddress = keys.bchWallet.addr;
const realMoney = keys.realMoney;

sweepAllBch();

async function sweepAllBch() {
  // Scan through tip wallets by wif, see if there is money to sweep, and output a new object
  // of what you need to build your sweeping tx
  const sweepBuilder = [];
  const sweepAddresses = [];
  sweepableWallets.forEach(sweepableWallet => {
    const sweepChunk = {};
    // get ec pair from wif
    const ecPair = bitbox.ECPair.fromWIF(sweepableWallet.wif);
    // get address from ecpair
    const fromAddr = bitbox.ECPair.toCashAddress(ecPair);
    sweepChunk.ecPair = ecPair;
    sweepChunk.fromAddr = fromAddr;
    sweepAddresses.push(fromAddr);
    sweepBuilder.push(sweepChunk);
  });
  console.log(sweepBuilder);

  const u = await bitbox.Address.utxo(sweepAddresses);

  //console.log(`utxos:`);
  //console.log(u);

  // Add the utxos to the sweepbuilder array
  // iterate over utxo object
  // if the address matches a sweepbuilder entry, add it to that entry
  // might be best to do this step in the txbuilder loop

  for (let i = 0; i < u.length; i += 1) {
    // utxos come back in same order they were sent
    // handle case that not all addresses will have utxos later
    sweepBuilder[i].utxos = u[i].utxos;
  }
  //console.log(`completed sweepBuilder:`);
  //console.log(sweepBuilder);

  // now make that return tx
  const transactionBuilder = new bitbox.TransactionBuilder();
  let originalAmount = 0;
  let inputCount = 0;

  // loop over sweepBuilder
  for (let j = 0; j < sweepBuilder.length; j++) {
    // Loop through all for each tip with utxos and add as inputs
    for (let i = 0; i < sweepBuilder[j].utxos.length; i++) {
      const utxo = sweepBuilder[j].utxos[i];

      originalAmount += utxo.satoshis;
      //console.log(`Input ${inputCount + 1}: { ${utxo.txid} , ${utxo.vout}}`);

      transactionBuilder.addInput(utxo.txid, utxo.vout);
      inputCount += 1;
    }
  }
  if (originalAmount < 1) {
    console.log(`originalAmount is 0, handle as error`);
  }
  //console.log(`Total inputs: ${inputCount}`);
  const byteCount = bitbox.BitcoinCash.getByteCount(
    { P2PKH: inputCount },
    { P2PKH: 1 }
  );
  const fee = Math.ceil(1.1 * byteCount);
  //console.log(`fee: ${fee}`);
  // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
  const sendAmount = originalAmount - fee;
  //console.log(`sendAmount: ${sendAmount}`);

  // add output w/ address and amount to send
  transactionBuilder.addOutput(
    bitbox.Address.toLegacyAddress(sweepToAddress),
    sendAmount
  );

  // Loop through each input and sign
  let redeemScript;
  let signedInputCount = 0;
  for (let j = 0; j < sweepBuilder.length; j++) {
    for (let i = 0; i < sweepBuilder[j].utxos.length; i++) {
      const utxo = sweepBuilder[j].utxos[i];
      // console.log(`utxo[${i}]: ${utxo.vout}`);
      // console.log(utxo);
      // console.log(`signing ecPair:`);
      // console.log(sweepBuilder[j].ecPair);
      transactionBuilder.sign(
        signedInputCount,
        sweepBuilder[j].ecPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        utxo.satoshis
      );
      signedInputCount += 1;
      /*
      console.log(
        `Signed input ${i} round ${j} with ${sweepBuilder[j].ecPair.d[0]}`
      );
      */
    }
  }
  // build tx
  const tx = transactionBuilder.build();
  // output rawhex
  const hex = tx.toHex();

  if (realMoney) {
    try {
      const txid = await bitbox.RawTransactions.sendRawTransaction([hex]);
      const txidStr = txid[0];
      console.log(`Sent sweep transaction with txid: ${txid}`);
    } catch (err) {
      console.log(`Error in broadcasting transaction:`);
      console.log(err);
    }
  } else {
    console.log(hex);
  }
}
