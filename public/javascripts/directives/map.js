angular.module('mapchat')
    .directive('map', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/map.html'
        };
    });