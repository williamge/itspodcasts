var app = angular.module("main", []);

app.controller("episodeList", function($scope, $http) {

    $scope.episodes = [];

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

    $http.get(
        '/json/episodes/recent'
    ).success(function(data) {
        $scope.episodes = data;
    });

});
