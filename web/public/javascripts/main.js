angular.module("main", ['ngAnimate'])
    .service("filtersService", [

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

            self.addFilter = filters.addFilter;

            self.getChannelImageURL = function(channel) {
                if (channel.images[0]._id) {
                    return '/channel_images/' + channel.images[0]._id + '.jpg';
                } else {
                    return "";
                }
            };

            self.showEpisodeInfo = false;
            self.showChannelInfo = false;

            self.toggleEpisodeInfo = function() {
                self.showEpisodeInfo = !self.showEpisodeInfo;
            };

            self.toggleChannelInfo = function() {
                self.showChannelInfo = !self.showChannelInfo;
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
    ])
    .directive('filtersButton', function() {
        return {
            templateUrl: 'templates/filtersButton.html',
            replace: true,
            scope: {
                episode: '='
            },
            controller: 'filtersButtonCtrl',
            controllerAs: 'ctrl'
        };
    })
    .controller('filtersButtonCtrl', ['$scope', 'filtersService',
        function($scope, filters) {

            var self = this;

            self.episode = $scope.episode;

            self.filterByChannel = filters.filters.filterByChannel;
            self.filterByDate = filters.filters.filterByDate;
            self.addFilter = filters.addFilter;

            self.showFilters = false;

            self.expandFilters = function() {
                self.showFilters = !self.showFilters;
            };
        }
    ])
    .directive('channelInfo', function() {
        return {
            templateUrl: 'templates/channelInfo.html',
            replace: true,
            scope: {
                channel: '='
            },
            controller: 'channelInfoCtrl',
            controllerAs: 'ctrl'
        };
    })
    .controller('channelInfoCtrl', ['$scope',
        function($scope) {

            var self = this;

            self.channel = $scope.channel;

            self.explicit = function(channel) {
                return channel.explicit === 'true';
            };

            self.showMore = false;

            self.toggleInfo = function() {
                self.showMore = !self.showMore;
            };

            self.getChannelImageURL = function(channel) {
                if (channel.images[0]._id) {
                    return '/channel_images/' + channel.images[0]._id + '.jpg';
                } else {
                    return "";
                }
            };

        }
    ])
    .directive('episodeInfo', function() {
        return {
            templateUrl: 'templates/episodeInfo.html',
            replace: true,
            scope: {
                episode: '='
            },
            controller: 'episodeInfoCtrl',
            controllerAs: 'ctrl'
        };
    })
    .controller('episodeInfoCtrl', ['$scope',
        function($scope) {

            var self = this;

            self.episode = $scope.episode;

            self.showMore = false;

            self.formatDuration = function(duration) {
                var hours = Math.floor(duration / (60 * 60));
                var minutes = Math.floor((duration - hours * 60 * 60) / 60);
                var seconds = Math.floor(duration - hours * 60 * 60 - minutes * 60);

                var formattedDuration = '';

                if (hours > 0) {
                    formattedDuration += ('00' + hours).slice(-2) + ':';
                }
                if (minutes > 0 || hours > 0) {
                    formattedDuration += ('00' + minutes).slice(-2) + ':';
                }
                formattedDuration += ('00' + seconds).slice(-2);
                return formattedDuration;

            };

            self.toggleInfo = function() {
                self.showMore = !self.showMore;
            };
        }
    ])
    .directive('collapsible', function() {
        return {
            templateUrl: 'templates/collapsible.html',
            replace: true,
            transclude: true,
            scope: {
                expandText: '@',
                areaClass: '@'
            },
            controller: 'collapsibleCtrl',
            controllerAs: 'ctrl'
        };
    })
    .controller('collapsibleCtrl', ['$scope',
        function($scope) {

            var self = this;

            self.expandText = $scope.expandText || 'Expand';
            self.areaClass = $scope.areaClass;

            self.expand = false;

            self.toggleExpand = function() {
                self.expand = !self.expand;
            };
        }
    ])
    .directive('animClick', ['$parse', '$animate', '$rootScope',
        function($parse, $animate, $rootScope) {
            return {
                restrict: 'A',
                compile: function($element, attr) {
                    var animClass = $parse(attr.animClick, /* interceptorFn */ null, /* expensiveChecks */ true);
                    return function animClickHandler(scope, element) {
                        element.on('click', function(event) {
                            scope.$apply(function() {
                                $animate.animate(element, {}, {}, animClass());
                            });
                        });
                    };
                }
            };
        }
    ])
    .directive('stdButton', function() {
        return {
            templateUrl: 'templates/stdButton.html',
            transclude: true,
            replace: true
        };
    });
