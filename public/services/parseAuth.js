angular.module('FlightDeal')
    .factory('ParseAuth', function($http, $cookies) {
        // Initialize Parse
        Parse.initialize("3iN2g5ZkUItnQCjKaIEFyvShQ78musnMga7J4pzx", "tUWPCcEAOIfuZKTFUuLSkNw5NVi3UPVLOuVrASMs");

        return {
            isAuthenticated: function() {
                return Parse.User.current() != null && Parse.User.current().authenticated();
            },
            signUp: function(username, password) {
                return Parse.User.signUp(username, password, { ACL: new Parse.ACL() });
            },
            login: function(username, password) {
                return Parse.User.logIn(username, password).then(function() {
                    return Parse.Session.current();
                }).then(function(session) {
                    $cookies.session = session.getSessionToken();
                });
            },
            logout: function() {
                return Parse.User.logOut().then(function() {
                    $cookies.session = null;
                });
            }
        };
    });