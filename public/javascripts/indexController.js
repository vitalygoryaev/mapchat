"use strict";

angular.module('mapchat')
    .run(function ($rootScope) {
        $rootScope.version = 1; 
    })
    .controller('index', function($scope, $anchorScroll, $document) {
        var self = this;

        self.messages = [];
        self.radius = localStorage.getItem('radius') || 300; // meters
        self.userName = localStorage.getItem('userName');
        self.showLocationError = false;
        self.showMap = false;
        self.showSettings = false;
        var openedInfowindows = {};
        var map;
        self.locationErrorMessage = 'Could not get your location. Check if Location Services are enabled on your device.';

        var socket = io();

        navigator.geolocation.getCurrentPosition(newLocation, locationFailed);

        startWatchPosition();

        socket.on('messagesDelivered', function(messages) {
            self.socketId = '/#' + this.id;
            self.messages = messages || [];
            $scope.$digest();
            scrollToBottom();
            //renderMessagesOnMap();
        });

        socket.on('historyDelivered', function(messages) {
            self.messages = self.messages.concat(messages);
            $scope.$digest();
            $anchorScroll(self.firstMessageId);
            //renderMessagesOnMap();
        });

        socket.on('newMessageReceived', function(message) {
            self.messages.push(message);
            $scope.$digest();
            scrollToBottom();
            //renderMessagesOnMap();
        });
        
        this.sendMessage = function (messageText) {
            if (!self.userName) {
                self.showSettings = true;
                return;
            }

            socket.emit("newMessage", { messageText: messageText, position: self.position, userName: self.userName });

            self.messageText = '';
        }

        function newLocation(location) {
            self.showLocationError = false;
                
                var position = {
                    longitude: location.coords.longitude,
                    latitude: location.coords.latitude,
                    accuracy: location.coords.accuracy
                };

                self.position = position;

                socket.emit("newPosition", { position: position, radius: self.radius });
        }

        function locationFailed(err) {
            self.showLocationError = true;
            console.log("failed to get location: " + JSON.stringify(err));
        }

        function startWatchPosition() {
            navigator.geolocation.watchPosition(onNewLocation, locationFailed);
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

        self.getMessageDistance = function (message) {
            return distance(self.position.latitude, self.position.longitude, message.position.latitude, message.position.longitude);
        }

        function scrollToBottom() {
            if (self.lastMessageIsVisible) {
                $anchorScroll('afterMessagesAnchor');
            }
        }

        self.getHistory = function(firstMessageId) {
            if (!self.lastMessageIsVisible) {
                console.log("loading history");
                self.firstMessageId = firstMessageId;
                socket.emit('getHistory', self.messages.length);
            }
        }
        
        self.renderMap = function(message) {
            function showMessagesOnMap() {
                var myLatLng = {lat: message.position.latitude, lng: message.position.longitude};

                renderMessagesOnMap();

                map.setCenter(myLatLng);
                map.setZoom(18);
            }

            if (!map) {
                setTimeout(showMessagesOnMap, 500);
            } else {
                showMessagesOnMap();
            }

            self.showMap = true;
        }

        function renderMessagesOnMap() {
            if (self.messages) {
                var mapDiv = document.getElementById('map');
                var myLatLng = {lat: self.messages[0].position.latitude, lng: self.messages[0].position.longitude};

                if (!map) {
                    map = new google.maps.Map(mapDiv, {
                        zoom: 18,
                        center: myLatLng
                    });
                }

                self.messages.forEach(function (messageItem) {
                    if (!openedInfowindows[messageItem._id]) {
                        var messageLatLng = {lat: messageItem.position.latitude, lng: messageItem.position.longitude};

                        var infowindow = new google.maps.InfoWindow({
                            content: messageItem.messageText
                        });

                        infowindow.setPosition(messageLatLng);

                        openedInfowindows[messageItem._id] = infowindow;
                        infowindow.open(map);
                    }
                });

                // close infowindows that dont have messages anymore
                Object.keys(openedInfowindows).forEach(function(messageId) {
                    var found = false;

                    self.messages.forEach(function(messageItem) {
                        if (messageItem._id === messageId) {
                            found = true;
                        }
                    });

                    if (!found) {
                        openedInfowindows[messageId].close();
                        delete openedInfowindows[messageId];
                    }
                });
            }
        }

        self.closeMap = function() {
            self.showMap = false;
        }

        self.closeSettings = function() {
            self.showSettings = false;

            // save nick and radius to local storage
            if (self.radius) {
                localStorage.setItem('radius', self.radius);
            }
            
            if (self.userName) {
                localStorage.setItem('userName', self.userName);
            }
        }
    });
