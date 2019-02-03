Here we have some minimal command-line nodejs that can be run to show
how to use armlet and interact with the MythX API.

See the [openapi spec](https://api.mythx.io/v1/openapi) for details of the MythX API.

Input parameter handling is minimal and command options are lacking so
we can focus on how to set up and call the client.


* [analysis](https://github.com/ConsenSys/armlet/blob/master/example/analysis): Submit a JSON with Solidity source and EVM bytecode information to the MythX and retrieve results.
* [analysis-status](https://github.com/ConsenSys/armlet/blob/master/example/analysis): Get status of a prior MythX analysis request.
* [analysis-issues](https://github.com/ConsenSys/armlet/blob/master/example/analysis): Get issues reported from a prior MythX analysis.
* [list-analyses](https://github.com/ConsenSys/armlet/blob/master/example/list-analyses): Get issues reported from a prior MythX analysis.
* [api-version](https://github.com/ConsenSys/armlet/blob/master/example/api-version): Retrieve MythX API version information. JSON is output.
* [openapi-spec]((https://github.com/ConsenSys/armlet/blob/master/example/api-version)): Retrieve the current MythX openapi specification. YAML is output.

See [folder `typescript`](https://github.com/ConsenSys/armlet/tree/master/example/typescript) for some of these examples written in [typescript](https://www.typescriptlang.org/).
