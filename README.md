# whois-stats

## Rationale
All Regional Internet Registries (RIRs) publish statistics that
describe the state of the network resources they manage. These
statistics are updated daily. whois-stats allows you to access
these statistics as a stream of JSON objects.

## Usage

```javascript
var stats = require('whois-stats');

stats.statsFromFTP(ws.ARIN_LATEST, function (err, stream) {
    if (err) throw err;
    stream.on('entry', function (entry) {
        // Do something with record
    });
});
```

## Why should I care?
* Quantify IPv4 exhaustion
* Diff for new allocations
* Identify conflicts
* Store to object db
