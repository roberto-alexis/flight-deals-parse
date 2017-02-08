angular.module('FlightDeal')
    .controller('HomeCtrl', function($scope, ParseAuth, $alert, Account) {
        // Placeholder for new posts or post being edited
        $scope.newPost = {};
        $scope.pageSize = 10;
        $scope.totalRecords = 0;
        $scope.currentPage = 1;

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
         * Get the last posts
         */
        $scope.getPosts = function(newPageNumber) {
            $scope.currentPage = newPageNumber;
            Account.getPosts($scope.pageSize, (newPageNumber - 1) * $scope.pageSize)
                .success(function(posts) {
                    $scope.posts = _.map(posts.rows, function(row) {
                        return _.extend(row, {
                           pubDate: moment(row.pubDate).fromNow()
                        });
                    });
                    $scope.totalRecords = posts.total;
                })
                .error(errorHandling);
        };

        $scope.getPosts(0);

        $scope.editPost = function(postId) {
            var selectedPost = _.find($scope.posts, function(post) {
                return post.id == postId;
            });
            if (!selectedPost) {
                return;
            }
            $scope.newPost = _.clone(selectedPost);
        };

        $scope.cancelEdit = function() {
            $scope.newPost = {};
        };

        $scope.savePost = function() {
            Account.savePost($scope.newPost)
                .success(function() {
                    $scope.newPost = {};
                    $scope.getPosts();
                    $('#editPost').collapse('hide');
                })
                .error(errorHandling);
        };

        $scope.deleteSelectedPosts = function() {
            Account.deletePosts($scope.posts.selected)
                .success(function() {
                    $scope.posts.selected = [];
                    $scope.getPosts();
                })
                .error(errorHandling);
        };

        $scope.notifyProductionPosts = function() {
            Account.notifyProductionPosts($scope.posts.selected)
                .success(function() {
                    $scope.posts.selected = [];
                    $scope.getPosts();
                })
                .error(errorHandling);
        };

        $scope.notifyDebugPosts = function() {
            Account.notifyDebugPosts($scope.posts.selected)
                .success(function() {
                    $scope.posts.selected = [];
                    $scope.getPosts();
                })
                .error(errorHandling);
        };

        /**
         * Toggles the selection made from the checkbox
         */
        $scope.toggleCheck = function() {
            if ($scope.posts.selected && $scope.posts.length == $scope.posts.selected.length) {
                $scope.posts.selected = [];
            } else {
                $scope.posts.selected = _.map($scope.posts, function(post) {
                    return post.id;
                })
            }
        };
    });