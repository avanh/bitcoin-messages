# Bitcoin Messages  
Place a message in a Bitcoin block using the OP_RETURN field so that your message will be recorded on the blockchain. If using this on the Bitcoin mainnet you can prefix your message with EW to be included on [EternityWall](https://eternitywall.it/about/).  
You can use this with any Bitcoin Core RPC compliant node on the Mainnet, Testnet, or local Regtest. Just change the address and port to reach your node.  

## About  
There is one API endpoint at `/BTCmessage/api/submitMessage` that accepts POST requests. The body is one field:  
* { "message": "YOUR MESSAGE HERE" }  

### How It Works  
1. When the message comes in it is checked to make sure it's not empty and it's also under the 80 byte limit of the OP_RETURN field and is then converted to HEX.  
2. `getbalance` is called to make sure there's at least 500 sats, an arbitrary amount just to make sure there's enough for a transaction.  
3. `createrawtransaction` adds the HEX encoded message to the `data` field of a transaction.  
4. `fundrawtransaction` calculates the fee, sets the UTXO's to use, and sets the change address for itself to return the rest of the transaction to yourself.  
5. `signrawtransactionwithwallet` takes the raw transaction and signs it with your wallet.  
6. `sendrawtransaction` takes the now signed transaction and broadcasts it to the network to be included in a block while also returning the TX ID back to you.  

## How To Use  
### Requirements  
* Bitcoin node
  * RPC ports reachable
  * RPC user/pass
  * Wallet already created
  * Address already created
  * Enough BTC to pay a transaction fee  

### Setup  
When deploying this by default it will be listening on port 4455 but feel free to change the port in index.js to meet your needs. Three environment variables are needed for connecting to your BTC node, they are listed below.

#### Environment Variables  
`RPC_USER='RPC Username'`  
`RPC_PASSWORD='RPC Password'`  
`BTC_NODE='BTC URL/Container Name:PORT'`  