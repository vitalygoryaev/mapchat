angular.module('mapchat')
    .directive('messageList', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/messageList.html'
        };
    });