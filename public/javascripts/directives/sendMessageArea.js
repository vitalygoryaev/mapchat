angular.module('mapchat')
    .directive('sendMessageArea', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/sendMessageArea.html'
        };
    });