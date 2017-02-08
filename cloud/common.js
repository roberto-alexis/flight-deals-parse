var _ = require('underscore');
var Post = Parse.Object.extend("Post");

/**
 * Sends a push notification regarding one of the posts
 * @param post to notify
 */
exports.push = function(post) {
    if (!post.get("notifyProduct") && !post.get("notifyDebug")) {
        // Nothing to notify
        return Parse.Promise.as([]);
    }
    var userQuery = new Parse.Query(Parse.User);
    userQuery.notEqualTo("disableAllNotifications", true);
    var pushQuery = new Parse.Query(Parse.Installation);
    if (post.get("notifyProduction") && !post.get("notifyDebug")) {
        pushQuery.notEqualTo("isDebug", true);
    } else if (!post.get("notifyProduction") && post.get("notifyDebug")) {
        pushQuery.equalTo("isDebug", true);
    }
    pushQuery.matchesQuery("user", userQuery);
    Parse.Push.send({
        where: pushQuery,
        data: {
            alert: post.get("title"),
            badge: "Increment",
            title: "FlightDeal: New deal!",
            postId: post.id,
            link: post.get("link")
        }
    });
    // Update the post
    console.log("Pushing notification for post: " + post.id);
    return post.save({
        "notifiedProduction": post.get("notifiedProduction") || post.get("notifyProduction"),
        "notifiedDebug": post.get("notifiedDebug") || post.get("notifyDebug"),
        "notifyProduction": false,
        "notifyDebug": false
    });
};

exports.dateFormat = function(date) {
    return !!date ? moment(date).format("YYYY-MM-DD h:mm") : "";
};