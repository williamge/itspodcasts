angular.module("main", [])
    .factory("filtersService", [

        function() {
            var self = {};

            var currentFilters = {};

            self.episodesFilter = function(episode) {
                var output = true;
                var filters = currentFilters;
                for (var filter in filters) {
                    if (filters.hasOwnProperty(filter)) {
                        output = filters[filter](episode) && output;
                    }
                }
                return output;
            };

            self.filters = {};

            self.filters.filterByChannel = function(channelTitle) {
                return {
                    name: 'filterByChannel',
                    filter: function _filter(episode) {

                        return episode.channel.title === channelTitle;
                    }

                };
            };

            self.filters.filterByDate = function(date) {
                return {
                    name: 'filterByDate',
                    filter: function _filter(episode) {

                        var pubDate = new Date(episode.pubDate);
                        var filterDate = new Date(date);

                        return pubDate.toDateString() === filterDate.toDateString();
                    }
                };
            };

            self.addFilter = function(input, filter) {
                var filterInfo = filter(input);
                currentFilters[filterInfo.name] = filterInfo.filter;
            };

            self.removeFilter = function(filter) {
                var filterInfo = filter();
                if (filter) {
                    delete currentFilters[filterInfo.name];
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
    .controller("episodeList", ['$scope', '$http', 'filtersService',
        function($scope, $http, filters) {

            $scope.episodes = [];

            $scope.episodesFilter = filters.episodesFilter;

            $scope.formatDate = function(date) {
                return new Date(date).toUTCString() || "No date";
            };

            $scope.truncateLink = function(text, maxLength) {
                if (text.length > maxLength) {
                    var slicePoint = (maxLength - 5) / 2;
                    return text.slice(0, slicePoint) + " ... " + text.slice(-slicePoint);
                } else {
                    return text;
                }
            };

            $scope.filterByChannel = filters.filters.filterByChannel;

            $scope.filterByDate = filters.filters.filterByDate;

            $scope.setFilter = filters.addFilter;

            $scope.getChannelImageURL = function(channel) {
                if (channel.images[0]._id) {
                    return '/channel_images/' + channel.images[0]._id + '.jpg';
                } else {
                    return null;
                }
            };

            $http.get(
                '/json/episodes/recent'
            ).success(function(data) {
                $scope.episodes = data;
            });

        }
    ])
    .controller('appliedFilters', ['$scope', 'filtersService',
        function($scope, filters) {
            $scope.clearFilters = filters.clearFilters;

            $scope.filtersApplied = filters.filtersApplied;
        }
    ]);
