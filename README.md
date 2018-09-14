[![CircleCI](https://circleci.com/gh/ConsenSys/armlet.svg?style=svg)](https://circleci.com/gh/ConsenSys/armlet)

# Armlet, a Mythril API client

Armlet is a Node.js client for the Mythril Platform API.

# Usage

Install with:
```
$ npm i armlet
```

Then get the Mythril Platform analysis results with the promise returned by
the exposed function:
```javascript
const { Client } = require('armlet')

...

const client = new Client({apiKey: myApiKey})

client.analyze(myBytecode)
  .then(issues => {
    console.log(issues)
  }).catch(err => {
    console.log(err)
  })
```
For more info join the Mythril community at [Discord](https://discord.gg/kktn8Wt).
