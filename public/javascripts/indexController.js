"use strict";

angular.module('mapchat')
    .run(function ($rootScope) {
        $rootScope.version = 1; 
    })
    .controller('index', function($scope) {
        var self = this;

        self.messages = [];
        self.radius = 1000; // meters
        self.showLocationError = true;

        var socket = io();

        startWatchPosition();

        socket.on('messagesDelivered', function(messages) {
            self.socketId = '/#' + this.id;
            self.messages = messages || [];
            $scope.$digest();
        });

        socket.on('newMessageReceived', function(message) {
            console.log("got new message on client: " + JSON.stringify(message));
            self.messages.push(message);
            $scope.$digest();
        });
        
        this.sendMessage = function (messageText) {
            socket.emit("newMessage", { messageText: messageText, position: self.position });

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
    });
