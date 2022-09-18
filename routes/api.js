const express = require('express');
const axios = require('axios').default;
const dotenv = require('dotenv');

const router = express.Router();

dotenv.config();

const rpcUser = process.env.RPC_USER;
const rpcPass = process.env.RPC_PASSWORD;
const btcNode = process.env.BTC_NODE;

// BTC RPC URL - change address and port in .env
const nodeUrl = `http://${rpcUser}:${rpcPass}@${btcNode}/`;

// Headers for BTC RPC API
const headers = {
  'content-type': 'text/plain;',
};

function formatString(str) {
  return str.replace(/[\n]/gm, '');
}

// Check if BTC Node sent error or if something else
function errHandling(err) {
  if (err?.response?.data === undefined) {
    console.log(err);
  } else {
    console.log(err.response.data);
  }
}

// Submit the signed, raw TX to the node and network to be included in block
function sendRawTX(res, txHex) {
  const dataString = `{
    "jsonrpc":"1.0",
    "id":"btcmessage",
    "method":"sendrawtransaction",
    "params":[
      "${txHex}"
    ]
  }`;
  axios.post(nodeUrl, formatString(dataString), headers)
    .then((response) => {
    // send TX ID back
      res.send({ txid: response.data.result });
    }).catch((err) => {
      errHandling(err);
      res.send({ error: 'Server error please try again later' });
    });
}

// Sign the raw TX
function signRawTX(res, rawTX) {
  const dataString = `{
    "jsonrpc":"1.0",
    "id":"btcmessage",
    "method":"signrawtransactionwithwallet",
    "params":[
      "${rawTX}"
    ]
  }`;
  axios.post(nodeUrl, formatString(dataString), headers)
    .then((response) => {
      sendRawTX(res, response.data.result.hex);
    }).catch((err) => {
      errHandling(err);
      res.send({ error: 'Server error please try again later' });
    });
}

// Fund the raw TX
function fundRawTX(res, rawTX) {
  const dataString = `{
    "jsonrpc":"1.0",
    "id":"btcmessage",
    "method":"fundrawtransaction",
    "params":[
      "${rawTX}",
      {
        "fee_rate": 2
      }
    ]
  }`;
  axios.post(nodeUrl, formatString(dataString), headers)
    .then((response) => {
      signRawTX(res, response.data.result.hex);
    }).catch((err) => {
      errHandling(err);
      res.send({ error: 'Server error please try again later' });
    });
}

// Create the raw transaction containing the message
function createRawTX(res, msg) {
  const dataString = `{
    "jsonrpc":"1.0", 
    "id":"btcmessage", 
    "method":"createrawtransaction", 
    "params":[
      [],
      [
        {
          "data":"${msg}"
        }
      ]
    ]
  }`;
  axios.post(nodeUrl, formatString(dataString), headers)
    .then((response) => {
      fundRawTX(res, response.data.result);
    }).catch((err) => {
      errHandling(err);
      res.send({ error: 'Server error please try again later' });
    });
}

// Check available balance
function getBalance(res, msg) {
  const dataString = `{
    "jsonrpc":"1.0",
    "id":"btcmessage",
    "method":"getbalance",
    "params":[]
  }`;
  axios.post(nodeUrl, formatString(dataString), headers)
    .then((response) => {
      const balance = response.data.result;
      if (balance < 0.00000500) {
        res.send({ error: 'Not enough BTC. Please try later' });
      } else {
        createRawTX(res, msg);
      }
    }).catch((err) => {
      errHandling(err);
      res.send({ error: 'Server error please try again later' });
    });
}

// API to submit message
router.post('/submitMessage', (req, res) => {
  console.log(req.body);
  const msg = Buffer.from(req.body.message, 'utf8').toString('hex');
  const msgSize = Buffer.byteLength(msg);
  // OP_RETURN has max size of 80 bytes/160 char length hex
  if (msgSize > 160) {
    res.status(422).send({ error: 'Message must be under 80 bytes' });
  } else if (msgSize === 0) {
    res.status(422).send({ error: 'Message cannot be empty' });
  } else {
    getBalance(res, msg);
  }
});

module.exports = router;
