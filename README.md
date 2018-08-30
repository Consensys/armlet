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
  .then((issues) => {
    console.log(issues)
  }).catch((err) => {
    console.log(err)
  })
```
