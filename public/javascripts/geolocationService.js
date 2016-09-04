angular.module('mapchat')
    .service('$geolocation', function($sockets) {
        var self = this;
        self.radius = localStorage.getItem('radius') || 300; // meters

        self.startWatchPosition = function(newLocationCallback, locationFailedCallback) {
            navigator.geolocation.watchPosition(newLocation.bind(null, newLocationCallback), locationFailedCallback);
        }

        self.getCurrentPosition = function(newLocationCallback, locationFailedCallback) {
            navigator.geolocation.getCurrentPosition(newLocation.bind(null, newLocationCallback), locationFailedCallback);
        }

        self.getMessageDistance = function (message) {
            return distance(self.position.latitude, self.position.longitude, message.position.latitude, message.position.longitude);
        }

        function newLocation(locationCallback, location) {
            self.position = {
                longitude: location.coords.longitude,
                latitude: location.coords.latitude,
                accuracy: location.coords.accuracy
            };

            $sockets.onNewPosition(self.position, self.radius);

            locationCallback();
        }
        
        self.setRadius = function(radius) {
            self.radius = radius;
            $sockets.onNewPosition(self.position, radius);
        }

        function distance(lat1, lon1, lat2, lon2) {
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var theta = lon1-lon2;
            var radtheta = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            dist = Math.acos(dist);
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515;
            dist = dist * 1.609344 * 1000;
            return dist
        }
    });