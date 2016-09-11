angular.module('mapchat')
    .directive('messageArea', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/messageArea.html'
        };
    });