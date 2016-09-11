angular.module('mapchat')
    .directive('header', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/header.html'
        };
    });