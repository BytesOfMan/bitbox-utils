/*
sendBchAll.js

A script to send the full balance of a BCH address to another BCH address

Inputs (See `User Input`)
1) Receiving address defined by `receivingAddr`
2) Sending wallet defined by `mnemonic`
3) Flag var realMoney defined by `realMoney`

Outputs
1) If realMoney=true, a broadcast bch txid sending all BCH at Sending Address to Receiving Address
2) If realMoney=false, an unbroadcast hex rawtx of such a transaction
*/

"use strict";
//Import bitbox
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();
//Import keys
const keys = require("./keys");

//User Input
const realMoney = keys.realMoney;
const mnemonic = keys.mnemonic;
const receivingAddr = keys.bchReceivers.badger;

sendAll(mnemonic, receivingAddr);

function sendAll(mnemonic, receivingAddr) {
  firstGetUtxosSendAll(mnemonic, receivingAddr);
}

function firstGetUtxosSendAll(mnemonic, receivingAddr) {
  // Generate the wallet

  // root seed buffer
  const rootSeed = bitbox.Mnemonic.toSeed(mnemonic);

  let masterHDNode = bitbox.HDNode.fromSeed(rootSeed);

  // HDNode of BIP44 account
  const account = bitbox.HDNode.derivePath(masterHDNode, "m/44'/0'/0'");

  // derive the first external change address HDNode which is going to spend utxo
  const change = bitbox.HDNode.derivePath(account, "0/0");

  // get the cash address
  const cashAddr = bitbox.HDNode.toCashAddress(change);

  console.log(`Sending all BCH from ${cashAddr} to ${receivingAddr}`);

  // Get all UTXOs controlled by this wallet
  bitbox.Address.utxo(cashAddr).then(
    result => {
      //console.log(`UTXOs:`)
      //console.log(JSON.stringify(result.utxos))
      let utxos = result.utxos;
      if (utxos.length === 0) {
        return console.log(`No utxos at ${cashAddr}`);
      }
      return secondBuildTxSendAll(change, receivingAddr, utxos);
    },
    err => {
      console.log(`Error in bitbox.Address.utxo(${cashAddr})`);
      console.log(err);
    }
  );
}

function secondBuildTxSendAll(change, sendToAddr, utxos) {
  // Create batches
  // REST API only supports 20 UTXOs at a time. This is why batching.
  const batchSize = 20;

  // Calculate number of batches of batchSize to send
  let batchCount = 1; // always at least 1 batch

  // if utxos are the same as the batch size, then you have the integer division result
  if (utxos.length % batchSize === 0) {
    batchCount = Math.floor(utxos.length / batchSize);
  }
  // Otherwise you get 1 extra batch
  else {
    batchCount = Math.floor(utxos.length / batchSize) + 1;
  }

  let utxoBatch = [];
  // Create utxos as array of arrays

  for (let i = 0; i < batchCount; i++) {
    // Initialize array within utxoBatch array
    utxoBatch[i] = [];
    for (let j = batchSize * i; j < batchSize * i + batchSize; j++) {
      // Note that the last batch won't have 20 UTXOs, so only push if there are UTXOs to push
      if (utxos[j]) {
        utxoBatch[i].push(utxos[j]);
      }
    }
  }

  for (let k = 0; k < batchCount; k++) {
    // Re-initialize these variables for each transaction of 20 or less inputs constructed
    let transactionBuilder = new bitbox.TransactionBuilder("bitcoincash");
    const inputs = [];
    let originalAmount = 0;

    // Set the batch for these transactions

    // Add all the inputs to this batch of transactions
    // REST API only supports 20 UTXOs at a time. This is why batching
    const utxoForThisBatch = utxoBatch[k];
    console.log(`Utxos for batch ${k + 1} of ${batchCount}:`);
    for (let z = 0; z < utxoForThisBatch.length; z++) {
      console.log(`${z + 1}: ${JSON.stringify(utxoForThisBatch[z])} `);
      originalAmount = originalAmount + utxoForThisBatch[z].satoshis;
      inputs.push(utxoForThisBatch[z]);
      transactionBuilder.addInput(
        utxoForThisBatch[z].txid,
        utxoForThisBatch[z].vout
      );
    }

    // TODO you could repeat yourself less in this to pay devs or to not pay devs conditional section

    let byteCount = bitbox.BitcoinCash.getByteCount(
      { P2PKH: inputs.length },
      { P2PKH: 1 }
    );

    // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
    let sendAmount = originalAmount - byteCount; //- 1500// make fee higher and see if this works
    //console.log(`sendAmount: ${sendAmount}`)

    //console.log(`destinationAddress: ${destinationAddress}`)
    //console.log(`winnerGets: ${winnerGets}`)
    //console.log(`keys.theHouse[0]: ${keys.theHouse[0]}`)
    //console.log(`devEach: ${devEach}`)

    // add output w/ address and amount to send
    transactionBuilder.addOutput(sendToAddr, sendAmount);
    console.log(
      `Transaction output added for payment of ${sendAmount} satoshis to ${sendToAddr}`
    );

    // keypair
    let keyPair = bitbox.HDNode.toKeyPair(change);

    // sign w/ HDNode
    let redeemScript;
    inputs.forEach((input, index) => {
      //console.log(`inputs[${index}]: ${util.inspect(inputs[index])}`)
      transactionBuilder.sign(
        index,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        inputs[index].satoshis
      );
    });

    // build tx
    let tx = transactionBuilder.build();

    // output rawhex
    let hex = tx.toHex();
    console.log(`SendAll Transaction ${k + 1} of ${batchCount} in hex:`);

    // sendRawTransaction to running BCH node, if realMoney is true
    if (realMoney) {
      bitbox.RawTransactions.sendRawTransaction(hex).then(
        result => {
          console.log(
            `SendAll transaction ${k +
              1} of ${batchCount} successfully sent, txid: ${result}`
          );
        },
        err => {
          console.console.log("Tx send failed");
          console.console.log(err);
        }
      );
    } else {
      // Call function to create and send tweet
      console.log(hex);
    }
  }
}
