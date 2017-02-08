var _ = require('underscore');

/**
 * Returns information about the logged user
 */
exports.me = function(req, res) {
    res.send({
       fullname: req.user.get("fullname")
    });
}
