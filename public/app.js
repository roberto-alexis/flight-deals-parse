// Initialize Angular
angular.module('FlightDeal', ['ngResource', 'ngMessages', 'ui.router', 'ngCookies', 'mgcrea.ngStrap', 'checklist-model', 'highcharts-ng', 'angularUtils.directives.dirPagination'])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'partials/home.html',
                controller: 'HomeCtrl'
            })
            .state('sources', {
                url: '/sources',
                templateUrl: 'partials/sources.html',
                controller: 'SourcesCtrl'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'partials/login.html',
                controller: 'LoginCtrl'
            })
            .state('logout', {
                url: '/logout',
                template: null,
                controller: 'LogoutCtrl'
            });

        $urlRouterProvider.otherwise('/');
    })
    .run(function($rootScope, $location, $state, ParseAuth) {
        $rootScope.$on( '$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
            var isLogin = toState.name === "login";
            if(isLogin){
                return; // no need to redirect
            }
            if(!ParseAuth.isAuthenticated()) {
                e.preventDefault(); // stop current execution
                $state.go('login'); // go to login
            }
        });
    });