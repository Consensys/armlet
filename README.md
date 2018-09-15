[![CircleCI](https://circleci.com/gh/ConsenSys/armlet.svg?style=svg)](https://circleci.com/gh/ConsenSys/armlet)

# Armlet, a Mythril Platform API client

Armlet is a Node.js client for the Mythril Platform API.

# Usage

Install with:
```
$ npm i armlet
```

Here is a small example of how you might use this client. For
demonstration purposes, we'll set an Mythril Platform API key and
EMAIL as environment variables:

```console
$ export MYTHRIL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
$ export EMAIL=me@example.com
```

Then get the Mythril Platform analysis results with the promise returned by
the exposed function:
```javascript
const armlet = require('armlet')
const client = new armlet.Client(
  {
      apiKey: process.env.MYTHRIL_API_KEY,
      userEmail: process.env.EMAIL  // adjust this
  })

client.analyze({bytecode: '0xf6'})
  .then(issues => {
    console.log(issues)
  }).catch(err => {
    console.log(err)
  })
```

See the example directory for some simple but runnable examples of how
to use the client.

For more info join the Mythril community at [Discord](https://discord.gg/kktn8Wt).
