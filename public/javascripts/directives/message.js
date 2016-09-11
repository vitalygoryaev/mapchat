angular.module('mapchat')
    .directive('message', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/message.html'
        };
    });