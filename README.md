[![CircleCI](https://circleci.com/gh/ConsenSys/armlet.svg?style=svg)](https://circleci.com/gh/ConsenSys/armlet)
[![Coverage Status](https://coveralls.io/repos/github/ConsenSys/armlet/badge.svg?branch=master)](https://coveralls.io/github/ConsenSys/armlet?branch=master)

# Armlet, a MythX API client wrapper

Armlet is a thin wrapper around the MythX API written in Javascript
which simplifies interaction with MythX. For example, the library
wraps API analysis requests into a promise.

# Installation

Just as with any nodejs package, install with:

```
$ npm install armlet
```

# Example

Here is a small example of how you might use this client. For
demonstration purposes, we’ll set the credentials created on the
MythX, you can use either the Ethereum address or email used during
[registration](https://docs.mythx.io/en/latest/main/getting-started.html#how-do-i-sign-up)
and the password you created:


```console
$ export MYTHX_PASSWORD='AAAyyyyyyyy@*#!?'
$ export MYTHX_ETH_ADDRESS=deadbeef000000
```

Then get the MythX analysis results with the promise returned by
the exposed function:

```javascript
const armlet = require('armlet')
const client = new armlet.Client(
  {
      password: process.env.MYTHX_PASSWORD,  // adjust this

      // Use one of the two options below
      ethAddress: process.env.MYTHX_ETH_ADDRESS,
      email: process.env.EMAIL  // adjust this
  })

const data = {
    "bytecode": "0x608060405234801561001057600080fd5b5060d48061001f6000396000f3fe608060405260043610603f576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806338d94193146044575b600080fd5b348015604f57600080fd5b50607960048036036020811015606457600080fd5b8101908080359060200190929190505050608f565b6040518082815260200191505060405180910390f35b600081600881101515609d57fe5b01600091509050548156fea165627a7a723058206f554b09240c9771a583534d72575fcfb4623ab4df3ddc139442047795fd383b0029",
};

client.analyzeWithStatus({data})
    .then(result => {
	const util = require('util');
	console.log(`${util.inspect(result.status, {depth: null})}`);
	console.log(`${util.inspect(result.issues, {depth: null})}`);
  }).catch(err => {
    console.log(err)
  })
```
You can also specify the timeout in milliseconds to wait for the analysis to be
done (the default is 10 seconds). Also, for statistical tracking you can tag the type of tool making the request using `clientToolName`.


As an example, to wait up to 5 seconds, and log analysis request as as use of `armlet-readme`, run:

```javascript
client.analyzeWithStatus({data, timeout: 5000, clientToolName: 'armlet-readme'})
  .then(result => {
    console.log(result.status, {depth: null})
    console.log(result.issues, {depth: null})
  }).catch(err => {
    console.log(err)
  })
```


See the [example
directory](https://github.com/ConsenSys/armlet/tree/master/example)
for some simple but runnable examples of how to use the client.

For more info join the Mythril community at [Discord](https://discord.gg/kktn8Wt).
