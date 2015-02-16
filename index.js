var fs = require('fs');
var URL = require('url');
var FTP = require('ftp');
var StatsParser = require('./parser');

// String Callback -> Void
// Gets a stream to a stats file via FTP
function statsFromFTP(url, cb) {
    try {
        var fields = parseURL(url);
        var ftp = new FTP();
        var options = {
            'host': fields.host,
            'port': fields.port
        };
        ftp.on('ready', function () {
            return getFTPStream(fields.path, ftp, cb);
        });
        ftp.connect(options);
    }
    catch (ex) {
        return cb(ex);
    }
}

// String Callback -> Void
// Gets a stream to a stats file hosted locally
function statsFromFile(path, cb) {
    try {
        var stream = fs.createReadStream(path);
        return statsFromStream(stream, cb);
    }
    catch (ex) {
        return cb(ex);
    }
}

// Stream Callback -> Void
// Consumes a stream and constructs a stats object
function statsFromStream(stream, ftp, cb) {
    var statsParser = new StatsParser();
    stream.pipe(statsParser);
    stream.on('end', function () {
        ftp.end();
    });
    return cb(null, statsParser);
}


// String Object Callback -> Void
// Gets a stream from an FTP connection
function getFTPStream(path, ftp, cb) {
    ftp.get(path, function (err, stream) {
        if (err) throw err;
        else 
            return statsFromStream(stream, ftp, cb);
    });
}

// String -> String
// Parses a path from a url
function parseURL(url) {
    var fields = URL.parse(url);
    fields.host = fields.host || 'localhost';
    fields.port = fields.port || '21';
    return fields;
}

exports.statsFromFTP = statsFromFTP;
exports.statsFromFile = statsFromFile;
exports.ARIN_LATEST = 'ftp://ftp.apnic.net/pub/stats/arin/delegated-arin-extended-latest';
exports.RIPE_LATEST = 'ftp://ftp.ripe.net/pub/stats/ripencc/delegated-ripencc-latest';
exports.APNIC_LATEST = 'ftp://ftp.apnic.net/pub/stats/apnic/delegated-apnic-latest';
exports.AFRINIC_LATEST = 'ftp://ftp.afrinic.net/pub/stats/afrinic/delegated-afrinic-extended-latest';
