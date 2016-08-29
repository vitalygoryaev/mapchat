"use strict";

angular.module('mapchat')
    .run(function ($rootScope) {
        $rootScope.version = 1; 
    })
    .controller('index', function($scope, $anchorScroll, $document) {
        var self = this;

        self.messages = [];
        self.radius = 1000; // meters
        self.showLocationError = false;
        self.showMap = false;
        self.locationErrorMessage = 'Could not get your location. Check if Location Services are enabled on your device.';

        var socket = io();

        startWatchPosition();

        socket.on('messagesDelivered', function(messages) {
            self.socketId = '/#' + this.id;
            self.messages = messages || [];
            $scope.$digest();
            scrollToBottom();
        });

        socket.on('historyDelivered', function(messages) {
            self.messages = self.messages.concat(messages);
            $scope.$digest();
            $anchorScroll(self.firstMessageId);
        });

        socket.on('newMessageReceived', function(message) {
            self.messages.push(message);
            $scope.$digest();
            scrollToBottom();
        });
        
        this.sendMessage = function (messageText) {
            socket.emit("newMessage", { messageText: messageText, position: self.position, userName: self.userName });

            self.messageText = '';
        }

        function startWatchPosition() {
            navigator.geolocation.watchPosition(function success(location) {
                self.showLocationError = false;
                
                var position = {
                    longitude: location.coords.longitude,
                    latitude: location.coords.latitude,
                    accuracy: location.coords.accuracy
                };

                self.position = position;

                socket.emit("newPosition", { position: position, radius: self.radius });
            }, function error(err) {
                self.showLocationError = true;
                console.log("failed to get location: " + JSON.stringify(err));
            });
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
            var myLatLng = {lat: message.position.latitude, lng: message.position.longitude};

            var mapDiv = document.getElementById('map');

            var map = new google.maps.Map(mapDiv, {
                zoom: 16,
                center: myLatLng
            });

            self.messages.forEach(function(messageItem) {
                var messageLatLng = {lat: messageItem.position.latitude, lng: messageItem.position.longitude};

                var infowindow = new google.maps.InfoWindow({
                    content: messageItem.messageText
                });

                infowindow.setPosition(messageLatLng);

                infowindow.open(map);
            });

            self.showMap = true;
        }
    });
