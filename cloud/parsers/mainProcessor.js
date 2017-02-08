var _ = require('underscore');
var Source = Parse.Object.extend("Source");
var moment = require('cloud/node_modules/moment/moment.js');
var outputProcessor = require('cloud/parsers/outputProcessor.js');
var rssParser = require('cloud/parsers/rssParser.js');
var riobardParser = require('cloud/parsers/riobardParser.js');

/**
 * Dictionary with all possible parsers. Each of them
 * implements a single method: parse(params, outputProcessor)
 * where 'params' are the parameters for this parser
 * and 'outputProcessor' is a {OutputProcessor} instance.
 */
var parserFunctionsByType = {
    "rss": rssParser.parse,
    "riobard": riobardParser.parse
};

/**
 * Executes the parser of a single source at a time. The source
 * pull data from will be the first one whose 'nextExec' is already
 * in the past. When picked, the given source 'nextExec' will be
 * bumped to the future for the time indicated in 'interval'.
 */
exports.process = function() {
    var sourceQuery = new Parse.Query(Source);
    sourceQuery.ascending("nextExec");
    sourceQuery.notEqualTo("enabled", false);
    sourceQuery.limit(1);
    return sourceQuery.find().then(function (sources) {
        if (!sources || sources.length < 1) {
            var message = "Nothing to do.";
            console.log(message);
            return Parse.Promise.error(message);
        }
        var source = sources[0];
        var nextExec = moment(source.get("nextExec") || new Date());
        var interval = source.get("execInterval") || 30;
        if (interval < 1) {
            var message = "Interval for this source is not configured";
            console.log(message);
            return Parse.Promise.error(message);
        }
        var now = moment();
        if (nextExec.diff(now, "minutes") > 0) {
            var message = "Nothing to do in the next: " + nextExec.diff(now, "minutes") + " minutes";
            console.log(message);
            return Parse.Promise.error(message);
        }
        // Move forward until the next time is past now
        while(nextExec.diff(now, "minutes") < 0) {
            nextExec = nextExec.add(interval, "minutes");
        }
        source.set("nextExec", nextExec.toDate());
        source.increment("execNum");
        return source.save();
    }).then(function(source) {
        var output = outputProcessor.createOutputProcessor(source);
        var params = source.get("parserParams");
        params.execNum = source.get("execNum");
        var parserType = source.get("parser");
        var parseFunc = parserFunctionsByType[parserType];
        if (!parseFunc) {
            return output.error("Unknown parser: " + parserType);
        }
        return parseFunc(params, output);
    });
};

/**
 * Collects stats of each source, by coping the current counters
 * to the daily counters. This task is supposed to be executed daily.
 * @returns a promise that will be fulfilled when all the sources
 * have been updated.
 */
exports.collectStats = function() {
    var sourceQuery = new Parse.Query(Source);
    var promises = [];
    return sourceQuery.find().then(function (sources) {
        _.each(sources, function(source) {
            var output = outputProcessor.createOutputProcessor(source);
            promises.push(output.collectStats());
        });
        return Parse.Promise.when(promises);
    });
}