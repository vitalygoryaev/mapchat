angular.module('mapchat')
    .filter('distance', function() {
        return function(distanceString) {
            if (distanceString === '0.00') {
                return 'Your exact position';
            }
            
            return 'Distance: ' + distanceString + 'm';
        };
    })
    .filter('time', function() {
        return function(dateString) {
            let date = new Date(dateString);

            var timeDifference = Date.now() - date.getTime();
            var second = 1000;
            var minute = 60000;
            var hour = 60 * 60 * 1000;

            if (timeDifference < minute) {
                return Math.floor(timeDifference / second) + 's ago';
            }

            if (timeDifference < hour) {
                return Math.floor(timeDifference / minute) + 'm ago';
            }

            if (timeDifference < 24 * hour) {
                return Math.floor(timeDifference / hour) + 'h ago';
            }

            return date;
        };
    });