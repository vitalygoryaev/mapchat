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
    
    