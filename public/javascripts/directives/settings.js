angular.module('mapchat')
    .directive('settings', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/settings.html'
        };
    });