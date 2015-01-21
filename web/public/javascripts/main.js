angular.module("main", [])
    .controller("episodeList", function($scope, $http) {

        $scope.episodes = [];

        $scope.episodesFilter = function(input) {
            var output = true;
            var filters = $scope.episodesFilter.filters;
            for (var filter in filters) {
                if (filters.hasOwnProperty(filter)) {
                    output = filters[filter](input) && output;
                }
            }
            return output;
        };

        $scope.episodesFilter.filters = {};

        $scope.filtersApplied = function() {
            return Object.keys($scope.episodesFilter.filters).length > 0;
        };


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

        $scope.filterByChannel = function(channelTitle) {
            $scope.filterByDate.name = 'filterByChannel';
            return function _filter(episode) {
                _filter.name = 'filterByChannel';

                return episode.channel.title === channelTitle;
            };
        };

        $scope.filterByDate = function(date) {
            $scope.filterByDate.name = 'filterByDate';
            return function _filter(episode) {

                var pubDate = new Date(episode.pubDate);
                var filterDate = new Date(date);

                return pubDate.toDateString() === filterDate.toDateString();
            };
        };

        $scope.setFilter = function(thing, filter) {
            $scope.episodesFilter.filters[filter.name] = filter(thing);
        };

        $scope.removeFilter = function(filter) {
            if (filter) {
                delete $scope.episodesFilter.filters[filter.name];
            } else {
                $scope.episodesFilter.filters = {};
            }

        };

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

    });
