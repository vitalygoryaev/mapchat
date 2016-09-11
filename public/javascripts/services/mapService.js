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