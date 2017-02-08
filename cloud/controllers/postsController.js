var _ = require('underscore');
var Post = Parse.Object.extend("Post");
var common = require('cloud/common.js');
var moment = require('cloud/node_modules/moment/moment.js');

/**
 * Retrieves a list of posts
 * @param req query string containing:
 * - offset: number of posts to skip from the top of the list
 * - limit: number of posts to return (default: 100)
 * - daysLimit: number of days to return (default: 7)
 * @param res an array of:
 * {
 * total: <approx. total number of records>,
 * rows: [
 *   {
 *    content: <content of the post>,
 *    imageUrl: <image of the post>
 *    link: <link to the post>,
 *    id: <unique id of this post>,
 *    title: <title of the post>,
 *    pubDate: <publication date>,
 *    createdAt: <time this post was added to the system>
 *    source: {
 *       name: <name of the source>
 *       iconUrl: <link to the image of this source>
 *       link: <link to the source>
 *    }
 * }]
 */
exports.list = function(req, res) {
    var countQuery = new Parse.Query(Post),
        postsQuery = new Parse.Query(Post),
        offset = req.query.offset || 0,
        limit = req.query.limit || 100,
        daysLimit = req.query.daysLimit || 7,
        rows = [],
        defaultImage = "http://www.pageresource.com/wallpapers/wallpaper/airplane-flight-clouds-sky-speed_114401.jpg";
    if (offset > 0) postsQuery.skip(offset);
    postsQuery.limit(limit < 100 ? limit : 100);
    postsQuery.descending("pubDate");
    if (daysLimit != 0)
        postsQuery.greaterThan("pubDate", moment().subtract(daysLimit, 'days').toDate());
    postsQuery.include("source");
    postsQuery.find().then(function(posts) {
        rows = _.map(posts, function (post) {
            var source = post.get("source");
            return {
                content: post.get("content"),
                contentHtml: post.get("contentHtml"),
                summary: post.get("summary"),
                imageUrl: post.get("imageUrl") || defaultImage,
                link: post.get("link"),
                id: post.id,
                title: post.get("title"),
                pubDate: post.get("pubDate"),
                createdAt: post.createdAt,
                price: post.get("price"),
                from: post.get("from"),
                to: post.get("to"),
                source: {
                    iconUrl: source ? source.get("iconUrl") : null,
                    name: source ? source.get("name") : "Unknown",
                    link: source ? source.get("link") : null
                },
                notifiedProduction: post.get("notifiedProduction") || false,
                notifiedDebug: post.get("notifiedDebug") || false,
                isSpecial: post.get("isSpecial") || false,
                tags: post.get("tags") || [],
                seller: post.get("seller"),
                type: post.get("type")
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
 * Forces a push notification for a certain post
 * @param req query containing a valid "postId"
 * @param res indication of success or error
 */
exports.forcePush = function(req, res) {
    var postId = req.query.postId,
        postQuery = new Parse.Query(Post);
    postQuery.get(postId).then(function(post) {
        common.push(post);
        res.send("Post '" + post.get('title') + "' sent.");
    }).fail(function(error) {
       res.status(500);
    });
};

/**
 * Saves a post, either updating an existing one or creating a new one
 * @param req query string containing 'post' with the data of the new/updated
 * post. If this is for update, the 'post.id' attribute must be set.
 */
exports.save = function(req, res) {
    var newPost = req.body.post;
    var newPostId = newPost.id;
    var cleanNewPost = _.omit(newPost, 'id', 'notifiedProduction', 'notifiedDebug', 'pubDate', 'source');
    if (newPostId) {
        var postQuery = new Parse.Query(Post);
        console.log("Update post: " + newPostId);
        return postQuery.get(newPostId).then(function(post) {
            return post.save(cleanNewPost);
        }).then(function(post) {
            res.send("Post '" + newPostId + "' updated.");
        }).fail(function(error) {
            console.log(error);
            res.status(500);
        });
    } else {
        var post = new Post();
        console.log("New post");
        return post.save(_.extend(cleanNewPost,
            {
                pubDate: moment().toDate(),
                type: cleanNewPost.type || 'other'
            })
        ).then(function() {
            res.send("Post '" + newPost.title + "' created.");
        }).fail(function(error) {
            console.log(error);
            res.status(500);
        });
    }
};

/**
 * Deletes a set of posts
 * @param req array with the id of the posts to remove
 */
exports.delete = function(req, res) {
    var ids = req.body.ids,
        postQuery = new Parse.Query(Post);
    postQuery.containedIn("objectId", ids);
    return postQuery.find(function(posts) {
        console.log("Delete posts: " + JSON.stringify(posts));
        return Parse.Object.destroyAll(posts);
    }).then(function () {
        res.send("Deleted '" + ids.length + "' posts.");
    }).fail(function(error) {
        console.log(error);
        res.status(500);
    });
};

/**
 * Sends a notificatin for a set of posts.
 * @param req an object with:
 * {
 *   ids: array with the ids of the posts to notify
 *   notifyProduction: true if we need to notify production
 *   notifyDebug: true if we need to notify debug
 * }
 */
exports.notify = function(req, res) {
    var ids = req.body.ids,
        production = req.body.notifyProduction,
        postQuery = new Parse.Query(Post);
    postQuery.containedIn("objectId", ids);
    return postQuery.find(function(posts) {
        _.each(posts, function(post) {
            post.set("notifyDebug", !production);
            post.set("notifyProduction", production);
        });
        return Parse.Object.saveAll(posts);
    }).then(function(posts) {
        var promises = [];
        _.each(posts, function (post) {
            promises.push(common.push(post));
        });
        return Parse.Promise.when(promises);
    }).then(function() {
        res.send("Notified '" + ids.length + "' posts.");
    }).fail(function(error) {
        console.log(error);
        res.status(500);
    });
};