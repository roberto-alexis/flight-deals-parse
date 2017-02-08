require('cloud/app.js');

var common = require('cloud/common.js');
var sourceProcessor = require('cloud/parsers/mainProcessor');

/**
 * Parsing logic. This job should be scheduled frequently to consume data
 * from all the sources. Only one source will be processed on each cycle.
 * Ideally it should be set to run once a minute.
 */
Parse.Cloud.job("sourceProcessing", function(request, status) {
  sourceProcessor.process().then(function() {
    status.success("Processed successful.");
  }).fail(function(errorMessage) {
    status.success(errorMessage || "Unable to process main loop");
  });
});

/**
 * Collects statistics about each source. This job should be scheduled
 * to be executed once a day.
 */
Parse.Cloud.job("sourceStats", function(request, status) {
  sourceProcessor.collectStats().then(function() {
    status.success("Stats collected successfully.");
  }).fail(function(errorMessage) {
    status.success(errorMessage);
  });
});

/**
 * Processing of new posts. When a new post is saved, this trigger will
 * send the corresponding notifications.
 */
Parse.Cloud.afterSave("Post", function(request) {
  console.log("Post added: " + request.object.id + " (" + !request.object.existed() + ")");
  if (!request.object.existed()) {
    // Notify of any new post
    common.push(request.object);
  }
});