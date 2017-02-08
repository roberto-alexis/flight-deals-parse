angular.module('FlightDeal')
    .controller('LoginCtrl', function($scope, $alert, $state, $timeout, ParseAuth) {
        $scope.login = {
            working: false,
            wrong: false
        };
        $scope.authenticate = function() {
            $scope.login.working = true;
            $scope.login.wrong = false;

            ParseAuth.login($scope.login.username, $scope.login.password)
                .then(function() {
                    $state.go('home');
                    $alert({
                        content: 'You have successfully logged in',
                        animation: 'fadeZoomFadeDown',
                        type: 'material',
                        duration: 3
                    });
                })
                .fail(function(response) {
                    $scope.login.working = false;
                    $scope.login.wrong = true;
                    $scope.$apply();
                    $timeout(function () {
                        $scope.login.wrong = false;
                    }, 8000);
                });
        };
    });