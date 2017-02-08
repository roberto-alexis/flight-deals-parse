angular.module('FlightDeal')
    .controller('NavbarCtrl', function($scope, ParseAuth, Account) {
        $scope.isAuthenticated = function() {
            return ParseAuth.isAuthenticated();
        };

        var errorHandling = function(error) {
            //ParseAuth.logout();
            $alert({
                content: error && error.message ? error.message : "A problem has happened. Please try again!",
                animation: 'fadeZoomFadeDown',
                type: 'material',
                duration: 3
            });
        };

        /**
         * Get user's profile information.
         */
        $scope.getProfile = function() {
            Account.getProfile()
                .success(function(data) {
                    $scope.user = data;
                })
                .error(errorHandling);
        };

        $scope.getProfile();
    });