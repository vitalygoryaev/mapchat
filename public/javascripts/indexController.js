"use strict";

angular.module('mapchat')
    .run(function ($rootScope) {
        $rootScope.version = 1; 
    })
    .controller('index', function($scope, $anchorScroll, $document, $sockets, $geolocation, $map) {
        var self = this;

        self.messages = [];
        self.radius = $geolocation.radius;
        self.userName = localStorage.getItem('userName');
        self.showLocationError = false;
        self.showMap = false;
        self.showSettings = false;
        self.locationErrorMessage = 'Could not get your location. Check if Location Services are enabled on your device.';

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
            self.showLocationError = false;
            self.position = $geolocation.position;
        }

        function locationFailed(err) {
            self.locationStatus = { message: 'failed to get location', code: 'fail' };
            self.showLocationError = true;
            console.log("failed to get location: " + JSON.stringify(err));
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
    });
