/*
sendBchOneToMany.js

A script that sends a user-specified amount of BCH each to multiple BCH wallets
Useful for seeding multiple wallets with BCH so they can receive SLP and have it swept back

Inputs (See `User Input`)
1) A BCH wallet with enough balance to send the tx, specified by `mnemonic` 
2) The amount of BCH to send to each receiving address, specified by `seedBCH`
3) An array of wallets to receive the BCH, specified by `sweepableWallets` (note, use createBchWalletsBatch.js to create this)
4) `realMoney`

Outputs
1) If realMoney is true, a broadcast BCH transaction sending seedBCH BCH to each receiver wallet
2) If realMoney is false, a rawTx in hex, unbroadcast
*/

// Import Bitbox
let BITBOX = require("bitbox-sdk").BITBOX;
let bitbox = new BITBOX();

// Import keys
const keys = require("./keys");

// User Input
const realMoney = keys.realMoney;
const sweepableWallets = keys.sweepableWallets;
const bchWallet = keys.slpWallet;
// Amount of BCH to send to each address
const seedBCH = 0.0001;

const bchRequired = seedBCH * sweepableWallets.length;
const satoshisToSend = bitbox.BitcoinCash.toSatoshi(bchRequired);

console.log(
  `Sending ${seedBCH} BCH to each of ${sweepableWallets.length} wallets in sweepableWallets`
);

// Check if sending wallet has enough BCH to send
const mnemonic = bchWallet.mnemonic;
const sendingAddr = bchWallet.addr;
bitbox.Address.details(sendingAddr).then(
  result => {
    //console.log(result);
    //console.log(`Balance: ${result.balance} BCH`);
    const bchAvailable = result.balance + result.unconfirmedBalance;
    if (bchAvailable < bchRequired) {
      console.log(
        `${bchAvailable} BCH available at ${sendingAddr} out of ${bchRequired} and fees needed to fund your wallets`
      );
    } else {
      console.log(
        `${bchAvailable} available, enough to send ${bchRequired}. Building transaction...`
      );
      return prepareToSeedAllTheWallets();
    }
  },
  err => {
    console.log(err);
  }
);

function prepareToSeedAllTheWallets() {
  // get utxos
  // root seed buffer
  const rootSeed = bitbox.Mnemonic.toSeed(mnemonic);

  let masterHDNode = bitbox.HDNode.fromSeed(rootSeed);

  // HDNode of BIP44 account
  const account = bitbox.HDNode.derivePath(masterHDNode, "m/44'/145'/0'");

  // derive the first external change address HDNode which is going to spend utxo
  const change = bitbox.HDNode.derivePath(account, "0/0");

  // Get all UTXOs controlled by this wallet
  bitbox.Address.utxo(sendingAddr).then(
    result => {
      //log(`UTXOs:`)
      //log(JSON.stringify(result.utxos))
      let utxos = result.utxos;

      // Check if you can do this tx with only one utxo
      let candidateUTXO = {};

      const total = satoshisToSend + 250; // Add 250 satoshis to cover TX fee.
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
          return seedAllTheWallets(change, candidateUtxos);
        } else {
          console.log(
            `Insufficient balance to send ${satoshisToSend} satoshis with existing utxo set`
          );
        }
      } else {
        //console.log(`Sending tx with 1 utxo:`);
        //console.log(JSON.stringify(candidateUTXO));
        return seedAllTheWallets(change, [candidateUTXO]);
      }
    },
    err => {
      console.log(`Error in bitbox.Address.utxo(${sendingAddr})`);
      console.log(err);
    }
  );
}

function seedAllTheWallets(change, utxos) {
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
    { P2PKH: sweepableWallets.length + 1 } // +1 for change address output
  );

  const fee = Math.ceil(1.1 * byteCount);
  // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
  const changeAmount = originalAmount - satoshisToSend - fee;
  //console.log(`changeAmount: ${changeAmount}`);

  // Add outputs for each sweepableWallet
  for (let i = 0; i < sweepableWallets.length; i++) {
    const receivingAddr = sweepableWallets[i].addr;
    const outputSats = bitbox.BitcoinCash.toSatoshi(seedBCH);
    // add output w/ address and amount to send
    transactionBuilder.addOutput(receivingAddr, outputSats);
  }

  // add output for change address
  transactionBuilder.addOutput(
    bitbox.Address.toLegacyAddress(sendingAddr),
    changeAmount
  );

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
        console.log(`Transaction successfully sent, txid: ${result}`);
      },
      err => {
        console.log(`Transaction failed:`);
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
