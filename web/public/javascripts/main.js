angular.module("main", [])
    .factory("filtersService", [

        function() {
            var self = {};

            var currentFilters = {};

            self.currentFilters = function() {
                var output = [];

                for (var filterKey in currentFilters) {
                    if (currentFilters.hasOwnProperty(filterKey)) {
                        output.push(currentFilters[filterKey]);
                    }
                }
                return output;
            };

            self.episodesFilter = function(episode) {
                var output = true;
                for (var filterKey in currentFilters) {
                    if (currentFilters.hasOwnProperty(filterKey)) {
                        output = currentFilters[filterKey].filter(episode) && output;
                    }
                }
                return output;
            };

            self.filters = {};

            self.filters.filterByChannel = function(channelTitle) {
                return {
                    name: 'filterByChannel',
                    description: 'Channel: ' + channelTitle,
                    filter: function _filter(episode) {

                        return episode.channel.title === channelTitle;
                    }

                };
            };

            self.filters.filterByDate = function(date) {
                return {
                    name: 'filterByDate',
                    description: 'Day: ' + new Date(date).toDateString(),
                    filter: function _filter(episode) {

                        var pubDate = new Date(episode.pubDate);
                        var filterDate = new Date(date);

                        return pubDate.toDateString() === filterDate.toDateString();
                    }
                };
            };

            self.addFilter = function(input, filter) {
                var filterInfo = filter(input);
                currentFilters[filterInfo.name] = filterInfo;
            };

            self.removeFilter = function(filter) {
                if (filter) {
                    delete currentFilters[filter];
                } else {
                    currentFilters = {};
                }
            };

            self.clearFilters = function() {
                currentFilters = {};
            };

            self.filtersApplied = function() {
                return Object.keys(currentFilters).length > 0;
            };

            return self;
        }
    ])
    .directive('episodeList', function() {
        return {
            templateUrl: 'templates/episodeList.html',
            replace: true,
            scope: true,
            controller: 'episodeListCtrl',
            controllerAs: 'ctrl'
        };
    })
    .controller("episodeListCtrl", ['$http', 'filtersService',
        function($http, filters) {

            var self = this;

            self.episodes = [];

            self.episodesFilter = filters.episodesFilter;

            self.formatDate = function(date) {
                return new Date(date).toUTCString() || "No date";
            };

            self.truncateLink = function(text, maxLength) {
                if (text.length > maxLength) {
                    var slicePoint = (maxLength - 5) / 2;
                    return text.slice(0, slicePoint) + " ... " + text.slice(-slicePoint);
                } else {
                    return text;
                }
            };

            self.filterByChannel = filters.filters.filterByChannel;

            self.filterByDate = filters.filters.filterByDate;

            self.setFilter = filters.addFilter;

            self.getChannelImageURL = function(channel) {
                if (channel.images[0]._id) {
                    return '/channel_images/' + channel.images[0]._id + '.jpg';
                } else {
                    return null;
                }
            };

            $http.get(
                '/json/episodes/recent'
            ).success(function(data) {
                self.episodes = data;
            });

        }
    ])
    .directive('appliedFilters', function() {
        return {
            templateUrl: 'templates/appliedFilters.html',
            replace: true,
            scope: true,
            controller: 'appliedFiltersCtrl',
            controllerAs: 'ctrl'
        };
    })
    .controller('appliedFiltersCtrl', ['filtersService',
        function(filters) {

            var self = this;

            self.clearFilters = filters.clearFilters;

            self.filtersApplied = filters.filtersApplied;

            self.filters = filters;

            self.removeFilter = function(filter) {
                filters.removeFilter(filter.name);
            };
        }
    ])
    .directive('removeFilterLink', function() {
        return {
            templateUrl: 'templates/removeFilterLink.html',
            replace: true,
            scope: {
                filter: '='
            },
            controller: 'removeFilterLinkCtrl',
            controllerAs: 'ctrl'
        };
    })
    .controller('removeFilterLinkCtrl', ['$scope', 'filtersService',
        function($scope, filters) {

            var self = this;

            self.filter = $scope.filter;

            self.removeFilter = function(filter) {
                filters.removeFilter(filter.name);
            };
        }
    ]);
