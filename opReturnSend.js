/*
opReturnSend.js

A script to send an OP_RETURN transaction
Full function is 2 chained promises

1 - Get Utxo(s)
2 - build and send the tx

Inputs (See `User Input`)
1) User defined message to be included as OP_RETURN output as `msg`
2) A BCH wallet with a balance, defined by `mnemonic`
3) A receiving address, defined as `receivingAddr`
4) realMoney, defined in keys.js; if set to false, the script will generate a rawTx but not broadcast it

Outputs
1) If realMoney is true, a broadcast txid with user specified OP_RETURN output
2) If realMoney is false, a rawTx logged to console
 */

"use strict";
// Import Bitbox
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();
// Import keys
const keys = require("./keys");

// User Input
const realMoney = keys.realMoney;
const mnemonic = keys.mnemonic;
// Badger
const receivingAddr = keys.bchReceivers.badger;
const msg = "Dividend";

send(mnemonic, receivingAddr, 1000, msg);

function send(mnemonic, receivingAddr, satoshis, msg) {
  console.log(`Sending ${satoshis} satoshis to ${receivingAddr}`);
  firstGetUtxosSend(mnemonic, receivingAddr, satoshis, msg);
}

function firstGetUtxosSend(mnemonic, receivingAddr, satoshis, msg) {
  // Generate the wallet

  // root seed buffer
  const rootSeed = bitbox.Mnemonic.toSeed(mnemonic);

  let masterHDNode = bitbox.HDNode.fromSeed(rootSeed);

  // HDNode of BIP44 account
  const account = bitbox.HDNode.derivePath(masterHDNode, "m/44'/145'/0'");

  // derive the first external change address HDNode which is going to spend utxo
  const change = bitbox.HDNode.derivePath(account, "0/0");

  // get the cash address
  const sendingAddr = bitbox.HDNode.toCashAddress(change);

  //log(`Change Address: ${sendingAddr}`)
  //log(`Receiving Address: ${receivingAddr}`)

  // Get all UTXOs controlled by this wallet
  bitbox.Address.utxo(sendingAddr).then(
    result => {
      //log(`UTXOs:`)
      //log(JSON.stringify(result.utxos))
      let utxos = result.utxos;

      // Check if you can do this tx with only one utxo
      let candidateUTXO = {};

      const total = satoshis + 250; // Add 250 satoshis to cover TX fee.
      // Loop through all the UTXOs.
      for (let i = 0; i < utxos.length; i++) {
        const thisUTXO = utxos[i];
        //log(`thisUTXO.satoshis: ${thisUTXO.satoshis}`)
        //log(`total: ${total}`)
        // The UTXO must be greater than or equal to the send amount.
        if (thisUTXO.satoshis >= total) {
          // Automatically assign if the candidateUTXO is an empty object.
          if (!candidateUTXO.satoshis) {
            candidateUTXO = thisUTXO;
            continue;

            // Replace the candidate if the current UTXO is closer to the send amount.
          } else if (candidateUTXO.satoshis > thisUTXO.satoshis) {
            candidateUTXO = thisUTXO;
          }
        }
      }
      if (!candidateUTXO.amount) {
        //log(`No single Utxo, selecting multiple Utxos`)
        // If no utxos were big enough, keep adding the largest utxos until you can cover the tx
        // sort utxos by amount, highest to lowest
        utxos.sort((a, b) =>
          a.amount < b.amount ? 1 : b.amount < a.amount ? -1 : 0
        );
        //log(`sorted utxos:`)
        //log(JSON.stringify(utxos))

        // iterate through adding until your amount is big enough
        let candidateUtxos = [];
        let candidateUtxosBalance = 0;
        let canSend = false;
        // Loop through all the UTXOs again
        for (let i = 0; i < utxos.length; i++) {
          candidateUtxosBalance += utxos[i].satoshis;
          candidateUtxos.push(utxos[i]);
          //log(`Adding candidateUtxo: ${utxos[i].satoshis}`)
          //log(candidateUtxosBalance)
          //log(`Total send amount: ${total + 250*i}`)
          // bump total up for each additional output you will need
          if (candidateUtxosBalance >= total + i * 250) {
            canSend = true;
            break;
            //return candidateUtxos
          }
        }
        if (canSend) {
          // now you have enough utxos to cover the tx
          console.log(`Sending tx with ${candidateUtxos.length} utxos:`);
          console.log(JSON.stringify(candidateUtxos));
          return secondBuildTxSend(
            change,
            sendingAddr,
            receivingAddr,
            candidateUtxos,
            satoshis,
            msg
          );
        } else {
          console.log(
            `Insufficient balance to send ${satoshis} satoshis with existing utxo set`
          );
        }
      } else {
        console.log(`Sending tx with 1 utxo:`);
        console.log(JSON.stringify(candidateUTXO));
        return secondBuildTxSend(
          change,
          sendingAddr,
          receivingAddr,
          [candidateUTXO],
          satoshis,
          msg
        );
      }
    },
    err => {
      console.log(`Error in bitbox.Address.utxo(${sendingAddr})`);
      console.error(err);
    }
  );
}

function secondBuildTxSend(
  change,
  sendingAddr,
  receivingAddr,
  utxos,
  satoshisToSend,
  msg
) {
  let transactionBuilder = new bitbox.TransactionBuilder("bitcoincash");
  let originalAmount = 0;

  // Calculate the original amount in the wallet and add all UTXOs to the
  // transaction builder.
  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];

    originalAmount = originalAmount + utxo.satoshis;

    transactionBuilder.addInput(utxo.txid, utxo.vout);
  }

  if (originalAmount < 1) {
    console.log(`Original amount is zero. No BCH to send.`);
  }

  // get byte count to calculate fee. paying 1 sat/byte
  const byteCount = bitbox.BitcoinCash.getByteCount(
    { P2PKH: utxos.length },
    { P2PKH: 2 }
  );

  // add output w/ address and amount to send
  transactionBuilder.addOutput(receivingAddr, satoshisToSend);

  let buf = Buffer.from(msg, "ascii");
  let encoded = bitbox.Script.encodeNullDataOutput(buf);
  console.log(`Encoded OP_RETURN msg:`);
  console.log(encoded);
  const asm = bitbox.Script.toASM(encoded);
  console.log(`asm:`);
  console.log(asm);
  transactionBuilder.addOutput(encoded, 0);

  const fee = Math.ceil(1.1 * (byteCount + encoded.length));
  console.log(`fee: ${fee}`);
  // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
  const changeAmount = originalAmount - satoshisToSend - fee;
  console.log(`changeAmount: ${changeAmount}`);

  // add output for change address
  transactionBuilder.addOutput(sendingAddr, changeAmount);

  let redeemScript;

  // Loop through each input and sign
  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];

    const keyPair = bitbox.HDNode.toKeyPair(change);

    transactionBuilder.sign(
      i,
      keyPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      utxo.satoshis
    );
  }

  // build tx
  const tx = transactionBuilder.build();

  // output rawhex
  const hex = tx.toHex();

  if (realMoney) {
    bitbox.RawTransactions.sendRawTransaction(hex).then(
      result => {
        console.log(
          `Transaction successfully sent to ${receivingAddr}, txid: ${result}`
        );
      },
      err => {
        console.log(`Transaction to ${receivingAddr} failed:`);
        console.log(JSON.stringify(err));
      }
    );
  } else {
    console.log(
      `Transaction not sent because realMoney parameter is ${realMoney}`
    );
    console.log(`Raw tx:`);
    console.log(hex);
  }
}
