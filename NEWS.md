Release 2.0.0
=================

A lot has changed in the almost two weeks that have elapsed since the last release.

Changes for MythX API 1.4
-------------------------------

Perhaps the biggest change is that we now support version 1.4.0 of the MythX API. This means various authentication options involving an API key or an email address are no longer supported.

There were some smaller changes in the back end and the acceptable way to interact with the back-end protocol has been adjusted.


Geometrically-increasing delays in polling
-----------------------------------------------------

We noticed that there was a lot of overhead created on the back end caused by polling for analysis status. Taking a cue from how the Ethernet handles congestion, successive polls are now spaced more widely.

For applications which use MythX through armlet, when they can predict the likely time interval for the contract submitted, they will be rewarded with a reduced delay in noticing that results are ready on the back-end.

Parameter `initial-delay` was added. This is the minimum amount of time that this library waits before attempting its first status poll when the results are not already cached.

You can read about improving polling response [here](https://github.com/ConsenSys/armlet/#improving-polling-response).


Introducing command-line utility "mythx-analysis"
-------------------------------------------------------------

The "example" program `analysis` is now called `mythx-analysis` and it is installed as a standalone command-line utility.

It is more full featured:

   * it supports more armlet library options,
     `--version`, `--timeout`, `--delay`, and `--debug`
   * it can accept Solidity source code and will run `solc` to compile the source before passing
     on to MythX

Sample Solidity contracts now appear in [`example/solidity-files`](https://github.com/ConsenSys/armlet/tree/master/example/solidity-files)


Library changes not mentioned above
--------------------------------------------

An additional analysis option `debug` is available. With this, you can get more information about what is going on in armlet. Setting `debug` to a numeric value of 2 or more gives more-verbose output.


Getting a list of past analyses is not allowed as a trial user, as is now noted in the response. We suggest a suitable course of action (registering) and supply a link to do so.

Some small URL canonicalization is now done. In particular you can add a trailing slash to the HTTP host `https://api.mythx.io/` and that is the same things as `https://api.mythx.io`.

Similarly `http` will be turned into `https` when appropriate.

There is now proxy support via [`omni-fetch`](https://www.npmjs.com/package/omni-fetch) which is a wrapper to
[`isomorphic-fetch`](https://www.npmjs.com/package/isomorphic-fetch). This work was kindly contributed by Teruhiro Tagomori at NRISecure.

Additional tests were added and test-code coverage has been increased. This is the work of Daniyar Chambylov at Maddevs.

Some time units are shown in a more human-friendly way. There are numerous other small documentation and code improvements.

Older Releases
=================

v1.2.1 - 2019-02-06
-----------------------

- Better MythX API error reporting, esp HTTP 400, 401, 502, 504
- example analysis mode is "quick"

v1.2.0 - 2019-02-03
-----------------------

- tool status tracking via clientToolName
- Simplify example in README
- Adjust to accomodate looser required data fields
- If no registration set, run as a trial user
- More useful messages around common situations with remedial suggestions:
  * timeout
  * authentication problems
  * UUID not found
  * Sending JSON data which is too large
- Add interfaces to list previous analyses results and the status of each
- Add corresponding example programs for the above
- Numerous doc tweaks and code tweaks
