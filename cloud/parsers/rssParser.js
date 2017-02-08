/**
 * RSS parser implementation. See
 */
var _ = require('underscore');
var parserUtils = require('cloud/parsers/parserUtils.js');

/**
 * Extracts the URL of the first image from a HTML text.
 * @param html HTML text to process
 * @returns a string with the URL of the image or null of no image was found
 */
var extractImageUrl = function(html) {
    var reg = /src=\"([^\"]*)\"/;
    var res = reg.exec(html);
    return res ? res[1] : null;
};

/**
 * Parser that works over an RSS.
 * @param params
 * {
 *  rssUrl: Url where to send the requests to
 * }
 * @param output see 'outputProcessor.js'
 */
exports.parse = function(params, output) {
    console.log("RSS parsing with params: " + JSON.stringify(params) + ", output: " + JSON.stringify(output));
    return Parse.Cloud.httpRequest({
        url: params.rssUrl,
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    }).fail(function(httpResponse) {
        return output.error("Unable to read feeds: Error code: " + httpResponse.status + " - Content: " + httpResponse.text);
    }).then(function(httpResponse) {
        try {
            var data = JSON.parse(httpResponse.buffer);
            var feed = data.responseData.feed;
            var contentSeparator = '\u003e\n\t';
            _.each(feed.entries, function (entry) {
                try {
                    var titleParser = /^((\[FARE GONE\])\ )?(.*) – .*\$(.*): (.*) – (.*)\./g;
                    var titleParts = titleParser.exec(entry.title);
                    var tags = [];
                    if (titleParts && titleParts[2] == '[FARE GONE]') {
                        tags.push('gone');
                    }
                    output.pushDeal({
                        link: entry.link,
                        title: entry.title,
                        pubDate: new Date(entry.publishedDate),
                        content: entry.content.substr(entry.content.lastIndexOf(contentSeparator) + contentSeparator.length),
                        contentHtml: entry.content,
                        summary: parserUtils.trimInvisibleCharacters(entry.contentSnippet),
                        imageUrl: extractImageUrl(entry.content),
                        price: titleParts ? titleParts[4] : null,
                        from: titleParts ? titleParts[5] : null,
                        to: titleParts ? titleParts[6] : null,
                        seller: titleParts ? titleParts[3] : null,
                        tags: tags,
                        type: titleParts ? "flight" : "other"
                    });
                } catch(err) {
                    output.pushError("Error " + err.message + " processing: " + JSON.stringify(entry));
                }
            });
            return output.success();
        } catch(err) {
            return output.error("Error " + err.message + " trying to process response");
        }
    }).fail(function() {
        return output.error("Unable to process feed");
    });
};