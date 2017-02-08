angular.module('FlightDeal')
    .controller('SourcesCtrl', function($scope, ParseAuth, $alert, Account) {
        // Charts of successfully processed records
        var initialChartData = function(name) {
            return {
                options: {
                    chart: {
                        type: 'line',
                        spacingBottom: 5,
                        spacingTop: 5,
                        spacingLeft: 5,
                        spacingRight: 5,
                        height: 250
                    }
                },
                series: [],
                title: {
                    text: name
                },
                loading: false,
                yAxis: [{
                    min: 0.0,
                    floor: 0.0
                }],
                xAxis: {
                    labels: {
                        formatter: function() {
                            return moment().add(-7 + this.value, "days").fromNow();
                        }
                    }
                }
            };
        };

        $scope.recordsProcessed = initialChartData('Records Processed');
        $scope.errorExecs = initialChartData('Failed Executions');
        $scope.errorRecords = initialChartData('Failed Records');

        var errorHandling = function(error) {
            //ParseAuth.logout();
            $alert({
                content: error && error.message ? error.message : "A problem has happened. Please try again!",
                animation: 'fadeZoomFadeDown',
                type: 'material',
                duration: 3
            });
        };

        var calculateStatusRatio = function(dailyErrors, dailySuccess) {
            var numErrors = _.first(dailyErrors);
            var numSuccess = _.first(dailySuccess);
            var total = numSuccess + numErrors;
            return total > 0 ? numErrors / total : 0;
        }

        var calculateStatus = function(source) {
            var execsRatio = calculateStatusRatio(source.dailyErrorExecs, source.dailySuccessExecs);
            var recordsRatio = calculateStatusRatio(source.dailyErrorRecs, source.dailySuccessRecs);

            if (!source.enabled) {
                return 'default'
            } else if (execsRatio < 0.05 && recordsRatio < 0.05) {
                return 'success'
            } else if (execsRatio < 0.5 && recordsRatio < 0.5) {
                return 'warning'
            } else {
                return 'error'
            }
        }

        /**
         * Get the last posts
         */
        $scope.getSources = function() {
            Account.getSources()
                .success(function(sources) {
                    $scope.sources = _.map(sources.rows, function(row) {
                        return _.extend(row, {
                            nextExec: moment(row.nextExec).fromNow(),
                            status: calculateStatus(row),
                            interval: moment.duration(row.interval, "minutes").humanize()
                        });
                    });
                    // Update chart
                    $scope.recordsProcessed.series = _.map(sources.rows, function(source) {
                        return {
                            name: source.name,
                            data: source.dailySuccessRecs
                        };
                    });
                    $scope.errorExecs.series = _.map(sources.rows, function(source) {
                        return {
                            name: source.name,
                            data: source.dailyErrorExecs
                        };
                    });
                    $scope.errorRecords.series = _.map(sources.rows, function(source) {
                        return {
                            name: source.name,
                            data: source.dailyErrorRecs
                        };
                    });

                })
                .error(errorHandling);
        };

        $scope.getSources();

        var findSourceInScope = function(sourceId) {
            return _.find($scope.sources, function(source) {
               return source.id === sourceId;
            });
        }

        var updateSource = function(sourceId, data) {
            Account.updateSource(sourceId, data)
                .success(function() {
                    var source = findSourceInScope(sourceId);
                    _.extend(source, data);
                    source.status = calculateStatus(source);
                })
                .error(errorHandling);
        };

        $scope.toggleProduction = function(source) {
            updateSource(source.id, {notifyProduction : !source.notifyProduction});
        };

        $scope.toggleDebug = function(source) {
            updateSource(source.id, {notifyDebug : !source.notifyDebug});
        };

        $scope.toggleEnabled = function(source) {
            updateSource(source.id, {enabled : !source.enabled});
        };
    });
