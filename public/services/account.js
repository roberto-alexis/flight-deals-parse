angular.module('FlightDeal')
    .factory('Account', function($http) {
        return {
            getProfile: function() {
                return $http.get('/api/me');
            },
            getPosts: function(limit, offset) {
                return $http.get('/api/posts?limit=' + limit + '&offset=' + offset + "&daysLimit=0");
            },
            savePost: function(post) {
                return $http.post('/api/post', {post: post});
            },
            deletePosts: function(posts) {
                return $http.post('/api/deletePosts', {ids: posts});
            },
            notifyProductionPosts: function(posts) {
                return $http.put('/api/notifyPosts', {ids: posts, notifyProduction: true, notifyDebug: false});
            },
            notifyDebugPosts: function(posts) {
                return $http.put('/api/notifyPosts', {ids: posts, notifyProduction: false, notifyDebug: true});
            },
            getSources: function() {
                return $http.get('/api/sources');
            },
            updateSource: function(sourceId, data) {
                return $http.put('/api/source', {id: sourceId, data: data});
            }
        };
    });