# Molen, a Mythril API client

Molen is a Node.js client for the Mythril Platform API. According to
[Final Fantasy Wiki][1], a Molen is an "Extremely rare golem with a body
fashioned entirely of the purest mythril".

[1]: http://finalfantasy.wikia.com/wiki/Molen

# Usage

Install with:
```
$ npm -i molen
```

Then get the Mythril Platform analysis results with the promise returned by
the `analyze` function:
```javascript
const analyze = require('molen')

...
let issues = null

analyze({bytecode: myBytecode}, apiKey)
  .then((data) => {
    issues = data
  }).catch((err) => {
    console.log(err)
  })
```
