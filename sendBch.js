/*
sendBch.js
A script to send a user-specified amount of BCH from one address to another address
Full function is 2 chained promises

1 - Get Utxo(s)
2 - build and send the tx

Inputs (See `User Input`)
1) A BCH wallet, defined by `mnemonic`
2) `realMoney`
3) Amount to send in BCH, defined by `sendAmountBch`
4) Receiving address, defined by `receivingAddr`

Outputs
1) A broadcast BCH tx, if realMoney is true
2) A hex rawtx logged to console, if realMoney is false
 */

"use strict";
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();
let SLPSDK = require("slp-sdk");
let SLP = new SLPSDK();
const keys = require("./keys");

//User Input
const realMoney = keys.realMoney;
const mnemonic = keys.slpWallet.mnemonic;
const receivingAddr = keys.bchWallet.addr;
const sendAmountBch = 0.02;

const sendAmountSats = bitbox.BitcoinCash.toSatoshi(sendAmountBch);
const slpWallet = true;
send(mnemonic, receivingAddr, sendAmountSats, slpWallet);

function send(mnemonic, receivingAddr, satoshis, slpWallet) {
  console.log(`Sending ${satoshis} satoshis to ${receivingAddr}`);
  firstGetUtxosSend(mnemonic, receivingAddr, satoshis, slpWallet);
}

function firstGetUtxosSend(mnemonic, receivingAddr, satoshis, slpWallet) {
  // Generate the wallet

  // root seed buffer
  let rootSeed = bitbox.Mnemonic.toSeed(mnemonic);

  let masterHDNode = bitbox.HDNode.fromSeed(rootSeed);

  if (slpWallet) {
    rootSeed = SLP.Mnemonic.toSeed(mnemonic);
    masterHDNode = SLP.HDNode.fromSeed(rootSeed);
  }

  // HDNode of BIP44 account
  const account = bitbox.HDNode.derivePath(masterHDNode, "m/44'/145'/0'");

  // derive the first external change address HDNode which is going to spend utxo
  const change = bitbox.HDNode.derivePath(account, "0/0");

  // get the cash address
  const sendingAddr = bitbox.HDNode.toCashAddress(change);

  console.log(`Change Address: ${sendingAddr}`);
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
        console.log(`sorted utxos:`);
        console.log(JSON.stringify(utxos));

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
            satoshis
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
          satoshis
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
  satoshisToSend
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

  const fee = Math.ceil(1.1 * byteCount);
  // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
  const changeAmount = originalAmount - satoshisToSend - fee;
  console.log(`changeAmount: ${changeAmount}`);

  // add output w/ address and amount to send
  transactionBuilder.addOutput(receivingAddr, satoshisToSend);

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
