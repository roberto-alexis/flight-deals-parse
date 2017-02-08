var _ = require('underscore');
var Source = Parse.Object.extend("Source");
var common = require('cloud/common.js');
var moment = require('cloud/node_modules/moment/moment.js');

/**
 * Retrieves a list of sources
 * @param req query string containing:
 * - offset: number of posts to skip from the top of the list
 * - limit: number of posts to return (default: 100)
 * @param res an array of:
 * {
 * total: <approx. total number of records>,
 * rows: [
 *   {
 *    name,
 *    parserType,
 *    parserParams,
 *    nextUpdate,
 *    dailyErrorExecs,
 *    dailySuccessExecs,
 *    dailyErrorRecs,
 *    dailySuccessRecs,
 *    notifyProduction,
 *    notifyDebug
 * }]
 */
exports.list = function(req, res) {
    var countQuery = new Parse.Query(Source),
        sourcesQuery = new Parse.Query(Source),
        offset = req.query.offset || 0,
        limit = req.query.limit || 100,
        rows = [];
    if (offset > 0) sourcesQuery.skip(offset);
    sourcesQuery.limit(limit < 100 ? limit : 100);
    sourcesQuery.ascending("name");
    sourcesQuery.find().then(function(sources) {
        rows = _.map(sources, function (source) {
            return {
                id: source.id,
                name: source.get("name"),
                parserType: source.get("parser"),
                parserParams: source.get("parserParams"),
                nextExec: source.get("nextExec"),
                dailyErrorExecs: source.get("dailyErrorExecs"),
                dailySuccessExecs: source.get("dailySuccessExecs"),
                dailyErrorRecs: source.get("dailyErrorRecs"),
                dailySuccessRecs: source.get("dailySuccessRecs"),
                notifyProduction: source.get("notifyProduction"),
                notifyDebug: source.get("notifyDebug"),
                enabled: source.get("enabled"),
                interval: source.get("execInterval")
            };
        });
        return countQuery.count();
    }).then(function(total) {
        res.send({
            total: total,
            rows: rows
        });
    }).fail(function(error) {
        res.status(500);
    });
};

/**
 * Updates a source
 * @req body containing
 * {
 *   id: id of the source to update,
 *   data: new data to set
 * }
 */
exports.update = function(req, res) {
    var data = req.body.data;
    var sourceId = req.body.id;
    var sourceQuery = new Parse.Query(Source);
    console.log("Update source: " + sourceId);
    return sourceQuery.get(sourceId).then(function(source) {
        return source.save(data);
    }).then(function(source) {
        res.send("Post '" + sourceId + "' updated.");
    }).fail(function(error) {
        console.log(error);
        res.status(500);
    });
};