var util = require('util');
var Transform = require('stream').Transform;

// ftp://ftp.arin.net/pub/stats/arin/README
// `The vertical line character '|' (ASCII code 0x7c) is used as the
// CSV field separator.`
var FIELD_SEP = '|';

// ftp://ftp.arin.net/pub/stats/arin/README
// `Comments are denoted by # at the beginning of a line.`
var COMMENT_TOKEN = '#';

var StatsParser = function (options) {
    Transform.call(this, options);
    this._data = '';
    this._dispatchState = function(fields) {
        this._parseVersion(fields);
    };

    // Buffer -> Void
    // Adds chunk to data, parses any lines present
    this._transform = function (chunk, encoding, done) {
        this._data += chunk.toString();
        var lines = this._shiftLines();

        for (var i = 0; i < lines.length; i++) {
            var line = this._cleanLine(lines[i]);
            
            if (line.length > 0) {
                var fields = line.split(FIELD_SEP);
                this._dispatchState(fields);
            }
        }

        done();
    };

    // Void -> Array<String>
    // Removes & returns lines from data
    this._shiftLines = function () {
        var lines = this._data.split('\n');
        this._data = lines.pop();
        return lines;
    };

    // Array<String> -> Object
    // Parses a version record
    this._parseVersion = function (fields) {
        var entry = {};

        // Adds each field
        entry.formatVersion = fields[0];
        entry.registry = fields[1];
        entry.serial = fields[2];
        entry.numRecords = fields[3];
        entry.startDate = fields[4];
        entry.endDate = fields[5];
        entry.utcOffset = fields[6];
        entry._type = 'version';

        this._dispatchState = function (fields) {
            this._parseSummary(fields);
        };
        this.emit('entry', JSON.stringify(entry));
    };

    // Array<String> -> Object
    // Parses a summary record
    this._parseSummary = function (fields) {
        var entry = {};

        if (fields.pop() !== 'summary') {
            this._dispatchState = function (fields) {
                this._parseAllocation(fields);
            };
            return this._parseAllocation(fields);
        }
        
        // Adds each field
        entry.registry = fields[0];
        entry.type = fields[2];
        entry.count = fields[4];
        entry._type = 'summary';

        this.emit('entry', JSON.stringify(entry));
    };

    // Array<String> -> Object
    // Parses an allocation record
    this._parseAllocation = function (fields) {
        var entry = {};
        var fieldsLength = fields.length;

        entry.registry = fields[0];
        entry.cc = fields[1];
        entry.type = fields[2];
        entry.start = fields[3];
        entry.value = fields[4];
        entry.date = fields[5];
        entry.status = fields[6];

        // Handles extensions
        entry.extensions = [];
        if (fieldsLength > 7) {
            for (i = 7; i < fieldsLength; i++) {
                entry.extensions.push(fields[i]);
            }
        }

        entry._type = 'allocation';

        this.emit('entry', JSON.stringify(entry));
    };
    // String -> String
    // Removes comments and whitespace
    this._cleanLine = function (line) {
        // Removes comments
        var splitRecord = line.split(COMMENT_TOKEN);
        var rawRecord = splitRecord[0];

        // Removes whitespace
        return rawRecord.trim();
    };
};

util.inherits(StatsParser, Transform);
module.exports = StatsParser;
