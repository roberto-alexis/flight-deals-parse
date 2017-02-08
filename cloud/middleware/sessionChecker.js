/**
 * Interceptor that validates that the request received contains the
 * proper session cookie and that this session token is valid.
 * If everything goes right, it sets the current user into the request
 * as "user".
 * @param req request to validate
 * @param res response to use for sending error codes
 * @param next next method in the chain to call
 */
exports.interceptor = function(req, res, next) {
    var cookies = req.cookies;
    console.log(cookies);
    if (!cookies.session) {
        console.log("Missing cookies");
        res.status(401).send("Missing session");
        return;
    }
    Parse.User.become(cookies.session)
        .then(function() {
            req.user = Parse.User.current();
            next();
        })
        .fail(function(error) {
            console.log("Authentication error: " + error);
            res.status(403).send("Invalid session");
        });
};