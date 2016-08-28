angular.module('mapchat')
    .filter('distance', function() {
        return function(distanceString) {
            if (distanceString < 1) {
                return 'Your current position';
            }
            
            return 'Distance: ' + distanceString + 'm';
        };
    })
    .filter('time', function($filter) {
        return function(dateString) {
            var date = new Date(dateString);

            var todayDate = (new Date()).setHours(0,0,0,0);
            var messageDate = (new Date(date)).setHours(0,0,0,0);

            if (todayDate == messageDate) {
                return $filter('date')(date, 'HH:mm');
            }

            return $filter('date')(date, 'UTC');
        };
    });