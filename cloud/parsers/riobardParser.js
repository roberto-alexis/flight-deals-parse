/**
 * RSS parser implementation. See
 */
var _ = require('underscore');
var parserUtils = require('cloud/parsers/parserUtils.js');

/**
 * Parser obtains airport codes from Riobard website
 * @param params
 * {
 *  apiUrl: Url where to pull data from,
 *  pageSize: Size of the page to load,
 *  execNum: Sequencer with the execution number
 * }
 * @param output see 'outputProcessor.js'
 */
exports.parse = function(params, output) {
    console.log("Riobard parsing with params: " + JSON.stringify(params) + ", output: " + JSON.stringify(output));
    return Parse.Cloud.httpRequest({
        url: params.apiUrl,
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    }).fail(function(httpResponse) {
        return output.error("Unable to read API: Error code: " + httpResponse.status + " - Content: " + httpResponse.text);
    }).then(function(httpResponse) {
        try {
            var airports = JSON.parse(httpResponse.buffer);
            var limit = params.pageSize;
            var offset = (params.pageSize * params.execNum) % airports.length;
            console.log("Reading airports from " + offset + " to " + (offset + limit));
            _.each(airports.slice(offset, offset + limit), function (airport) {
                try {
                    output.pushAirport({
                        code: airport.code,
                        name: airport.name,
                        locationName: airport.location
                    });
                } catch(err) {
                    output.pushError("Error " + err.message + " processing: " + JSON.stringify(airport));
                }
            });
            return output.success();
        } catch(err) {
            return output.error("Error " + err.message + " trying to process response");
        }
    }).fail(function() {
        return output.error("Unable to process API");
    });
};