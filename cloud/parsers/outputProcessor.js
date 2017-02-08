/**
 * OutputProcessor class.
 * This class allows processing the resources of a parser. It requires
 * to receive the source of the processing (used for logging and stats)
 * and it accepts objects of different kinds.
 * Once all objects have been accepted, the producer needs to call 'success'.
 * If
 */

var _ = require('underscore');
var common = require('cloud/common.js');

/**
 * Creates a new {OutputProcessor}
 */
exports.createOutputProcessor = function(source) {
    /**
     * Constructor
     * @param source Parse "Source" object that is the source of the information
     * being processed.
     */
    function OutputProcessor(source) {
        this.source = source;
        this.deals = [];
        this.airports = [];
        this.lastError = null;
        this.numOkRecords = 0;
        this.numErrorRecords = 0;
    }

    /**
     * Adds an individual 'deal'
     * @param deal object with the following structure:
     * {
 *  link: link to the post
 *  title: title of the post
 *  pubDate: date (in Javascript Date format) of the publication of the post
 *  content: text only content of the post
 *  contentHtml: html version of the post (this could be the same as 'content')
 *  summary: small snippet of the post
 *  imageUrl: [Optional] URL of an image related ot the post
 *  from: [Optional] array of cities listed as "from" in the offer
 *  to: [Optional] array of cities listed as "to" in the offer
 *  min_price: [Optional] minimum price of the offer
 *  max_price: [Optional] maximum price of the offer
 * }
     */
    OutputProcessor.prototype.pushDeal = function(deal) {
        this.deals.push(deal);
        this.numOkRecords++;
    };

    /**
     * Adds an individual 'airport'
     * @param airport object containing:
     * {
     *  code: code of the airport,
     *  name: human name of the airport,
     *  locationName: human name of the place where the airport is located
     * }
     */
    OutputProcessor.prototype.pushAirport = function(airport) {
        this.airports.push(airport);
        this.numOkRecords++;
    };

    /**
     * Adds an individual error to be processed. This error will
     * count towards the statistics but won't prevent the processor
     * from keep accepting more data.
     * @param error string containing the error message to append.
     */
    OutputProcessor.prototype.pushError = function(error) {
        this.lastError = error;
        this.numErrorRecords++;
    };

    /**
     * Saves all accumulated deals (see 'pushDeal' for the
     * format of the deal object)
     * @private
     * @return {Promise} that will be fulfilled when all
     * deals have been saved.
     */
    OutputProcessor.prototype._saveDeals = function() {
        var Post = Parse.Object.extend("Post");
        var promises = [];
        var that = this;
        _.each(this.deals, function (entry) {
            var query = new Parse.Query(Post);
            query.equalTo('link', entry.link);
            promises.push(query.first().then(function (post) {
                if (!post) {
                    post = new Post();
                }
                entry.source = that.source;
                entry.notifyProduction = that.source.get("notifyProduction");
                entry.notifyDebug = that.source.get("notifyDebug");
                return post.save(entry);
            }));
        });
        return Parse.Promise.when(promises);
    };

    /**
     * Saves all accumulated airports (see 'pushAirport')
     * @private
     * @return {Promise} that will be fulfilled when all airports
     * have been saved.
     */
    OutputProcessor.prototype._saveAirports = function() {
        var Airport = Parse.Object.extend("Airport");
        var promises = [];
        var that = this;
        console.log("Airports detected: " + this.airports.length);
        _.each(this.airports, function (entry) {
            var query = new Parse.Query(Airport);
            query.equalTo('code', entry.code);
            promises.push(query.first().then(function (airport) {
                if (!airport) {
                    airport = new Airport();
                }
                return airport.save(entry);
            }));
        });
        console.log("New airports: " + promises.length);
        return Parse.Promise.when(promises);
    }

    /**
     * Completes the data gathering, counting this as a successful
     * parse.
     * @return {Promise} that will be fulfilled when all the data
     * has been persisted.
     */
    OutputProcessor.prototype.success = function() {
        var that = this;
        return that._saveDeals()
            .then(function() {
                return that._saveAirports();
            })
            .then(function() {
                // Save status
                that.source.increment("execs");
                that.source.increment("successfulExecs");
                that.source.increment("successfulRecords", that.numOkRecords)
                that.source.increment("errorRecords", that.numErrorRecords)
                that.source.set("lastError", that.lastError);
                return that.source.save();
            });
    };

    /**
     * Completes the data gathering, counting this as a failed
     * parse.
     * @return a promise that will be fulfilled when all the data
     * has been persisted.
     */
    OutputProcessor.prototype.error = function(errorMessage) {
        console.log("Execution results: error: " + errorMessage);
        this.source.increment("execs");
        this.source.increment("errorExecs");
        this.source.set("lastError", errorMessage);
        return this.source.save();
    };

    /**
     * Moves the value of the 'sourceKey' to an array in the 'targetKey', and
     * resets 'sourceKey'. When moving values to the 'targetKey' it also controls
     * that this array doesn't go beyond the provided limit.
     * @returns A promise that will be fulfilled when the data has been saved.
     * @private
     */
    OutputProcessor.prototype._collectStat = function(sourceKey, targetKey, limit) {
        var value = this.source.get(sourceKey) || 0;
        var collection = this.source.get(targetKey) || [];
        collection.push(value);
        while (collection.length > limit) {
            collection = collection.slice(1);
        }
        this.source.set(sourceKey, 0);
        this.source.set(targetKey, collection);
        return this.source.save();
    };

    /**
     * Accumulate daily stats for up to 60 days
     */
    OutputProcessor.prototype.collectStats = function() {
        var that = this;
        return this._collectStat("successfulExecs", "dailySuccessExecs", 60)
            .then(function() {
                return that._collectStat("errorExecs", "dailyErrorExecs", 60);
            }).then(function() {
                return that._collectStat("successfulRecords", "dailySuccessRecs", 60);
            }).then(function() {
                return that._collectStat("errorRecords", "dailyErrorRecs", 60);
            });
    };

    return new OutputProcessor(source);
};