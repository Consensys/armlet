[![CircleCI](https://circleci.com/gh/fgimenez/armlet.svg?style=svg&circle-token=3794de647a820eabf62e091c80d761a722b17b0c)](https://circleci.com/gh/fgimenez/armlet)

# Armlet, a Mythril API client

Armlet is a Node.js client for the Mythril Platform API.

# Usage

Install with:
```
$ npm i armlet
```

Then get the Mythril Platform analysis results with the promise returned by
the `analyze` function:
```javascript
const analyze = require('armlet')

...

analyze(myBytecode, myApiKey)
  .then(issues => {
    console.log(issues)
  }).catch(err => {
    console.log(err)
  })
```
For more info join the Mythril community at [Discord](https://discord.gg/kktn8Wt).
