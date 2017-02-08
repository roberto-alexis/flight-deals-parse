angular.module('FlightDeal')
    .controller('LogoutCtrl', function(ParseAuth, $alert, $location) {
        if (!ParseAuth.isAuthenticated()) {
            return;
        }
        ParseAuth.logout()
            .then(function() {
                $location.path("/#/login");
                $alert({
                    content: 'You have been logged out',
                    animation: 'fadeZoomFadeDown',
                    type: 'material',
                    duration: 3
                });
            });
    });