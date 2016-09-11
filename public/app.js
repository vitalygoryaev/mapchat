angular.module('mapchat', ['angular-inview']);

angular.module('mapchat')
    .filter('distance', function() {
        return function(distanceString) {
            if (distanceString < 1) {
                return 'Your current position';
            }
            
            return 'Distance: ' + distanceString + 'm';
        };
    })
    .filter('time', ['$filter', function($filter) {
        return function(dateString) {
            var date = new Date(dateString);

            var todayDate = (new Date()).setHours(0,0,0,0);
            var messageDate = (new Date(date)).setHours(0,0,0,0);

            if (todayDate == messageDate) {
                return $filter('date')(date, 'HH:mm');
            }

            return $filter('date')(date, 'yyyy-MM-dd HH:mm');
        };
    }]);
"use strict";
angular.module('mapchat')
    .controller('index', ['$scope', '$anchorScroll', '$sockets', '$geolocation', '$map', 
        function($scope, $anchorScroll, $sockets, $geolocation, $map) {
        var self = this;

        self.messages = [];
        self.radius = $geolocation.radius;
        self.userName = localStorage.getItem('userName');
        self.showLocationError = false;
        self.showMap = false;
        self.showSettings = false;
        self.locationStatus = { code: 'waiting', message: 'waiting for your location...'};

        $geolocation.getCurrentPosition(newLocation, locationFailed);
        $geolocation.startWatchPosition(newLocation, locationFailed);

        $sockets.onNewMessages(function(messages) {
            self.socketId = '/#' + this.id;
            self.messages = messages || [];
            $scope.$digest();
            scrollToBottom();
        });

        $sockets.onHistoryDelivered(function(messages) {
            self.messages = self.messages.concat(messages);
            $scope.$digest();
            $anchorScroll(self.firstMessageId);
        });

        $sockets.onNewMessageReceived(function(message) {
            self.messages.push(message);
            $scope.$digest();
            scrollToBottom();
        });
        
        this.sendMessage = function (messageText) {
            // ask to fill nickname
            if (!self.userName) {
                self.showSettings = true;
                $('#nickname').focus();
                return;
            }

            $sockets.sendMessage(messageText, self.userName, self.position);

            self.messageText = '';
        }

        function newLocation(location) {
            self.locationStatus = { code: 'success' };
            self.position = $geolocation.position;
            $scope.$digest();
        }

        function locationFailed(err) {
            self.locationStatus = { message: 'failed to get location', code: 'fail' };
            console.log("failed to get location: " + JSON.stringify(err));
            $scope.$digest();
        }

        self.getMessageDistance = $geolocation.getMessageDistance;

        function scrollToBottom() {
            if (self.lastMessageIsVisible) {
                $anchorScroll('afterMessagesAnchor');
            }
        }

        self.getHistory = function(firstMessageId) {
            if (!self.lastMessageIsVisible) {
                console.log("loading history");
                self.firstMessageId = firstMessageId;
                $sockets.getHistory(self.messages.length);
            }
        }
        
        self.renderMap = function(message) {
            $map.renderMap(message, self.messages);
            self.showMap = true;
        }

        self.closeMap = function() {
            self.showMap = false;
        }

        self.closeSettings = function() {
            self.showSettings = false;

            // save nick and radius to local storage
            if (self.radius) {
                localStorage.setItem('radius', self.radius);
                $geolocation.setRadius(self.radius);
            }
            
            if (self.userName) {
                localStorage.setItem('userName', self.userName);
            }
        }
    }]);

angular.module('mapchat')
    .directive('header', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/header.html'
        };
    });
angular.module('mapchat')
    .directive('map', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/map.html'
        };
    });
angular.module('mapchat')
    .directive('message', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/message.html'
        };
    });
angular.module('mapchat')
    .directive('messageArea', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/messageArea.html'
        };
    });
angular.module('mapchat')
    .directive('messageList', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/messageList.html'
        };
    });
angular.module('mapchat')
    .directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    scope.$apply(function (){
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });
angular.module('mapchat')
    .directive('sendMessageArea', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/sendMessageArea.html'
        };
    });
angular.module('mapchat')
    .directive('settings', function() {
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: './javascripts/directives/templates/settings.html'
        };
    });
angular.module('mapchat')
    .service('$geolocation', ['$sockets', function($sockets) {
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
    }]);
angular.module('mapchat')
    .service('$map', function() {
        var self = this;

        var openedInfowindows = {};
        var map;

        self.renderMap = function(message, messages) {
            function showMessagesOnMap() {
                renderMessagesOnMap(message, messages);
            }

            if (!map) {
                setTimeout(showMessagesOnMap, 500);
            } else {
                showMessagesOnMap();
            }
        }

        function renderMessagesOnMap(message, messages) {
            if (messages) {
                var mapDiv = document.getElementById('map');
                var myLatLng = {lat: message.position.latitude, lng: message.position.longitude};

                if (!map) {
                    map = new google.maps.Map(mapDiv, {
                        zoom: 18,
                        center: myLatLng
                    });
                }

                messages.forEach(function (messageItem) {
                    if (!openedInfowindows[messageItem._id]) {
                        var messageLatLng = {lat: messageItem.position.latitude, lng: messageItem.position.longitude};

                        var infowindow = new google.maps.InfoWindow({
                            content: '<div><b>' + messageItem.userName + '</b></div><div>' + messageItem.messageText + '</div>',
                            maxWidth: 250,
                            position: messageLatLng
                        });

                        openedInfowindows[messageItem._id] = infowindow;
                        infowindow.open(map);
                    }
                });

                // close infowindows that dont have messages anymore
                Object.keys(openedInfowindows).forEach(function(messageId) {
                    var found = false;

                    messages.forEach(function(messageItem) {
                        if (messageItem._id === messageId) {
                            found = true;
                        }
                    });

                    if (!found) {
                        openedInfowindows[messageId].close();
                        delete openedInfowindows[messageId];
                    }
                });

                map.setZoom(18);
                map.setCenter(myLatLng);
            }
        }
    });
angular.module('mapchat')
    .service('$sockets', function() {
        var self = this;
        var socket = io();

        self.onNewMessages = function(handler) {
            socket.on('messagesDelivered', handler);
        }

        self.onHistoryDelivered = function(handler) {
            socket.on('historyDelivered', handler);
        }

        self.onNewMessageReceived = function(handler) {
            socket.on('newMessageReceived', handler);
        }

        self.sendMessage = function (messageText, userName, position) {
            socket.emit("newMessage", { messageText: messageText, position: position, userName: userName });
        }

        self.onNewPosition = function (position, radius) {
            socket.emit("newPosition", { position: position, radius: radius });
        }

        self.getHistory = function (offset) {
            socket.emit('getHistory', offset);
        }
    });
    
    