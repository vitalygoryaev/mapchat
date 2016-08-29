let database = require('./storage');
let geo = require('./geolocation');
let consumers = {};
let storage = new database();
let myIO = {};

function socketsBase() {
    myIO = this.io;
    this.io.on('connection', socketsHandler.bind({ io: this.io }));
    this.io.on('disconnect', function disconnectHandler(socket) {
       delete consumers[socket.id];
    });
}

function socketsHandler(socket){
    socket.on('newMessage', function (message) {
        let consumer = consumers[socket.id];

        // reject consumer without position
        if (!consumer || !consumer.position || !consumer.position.longitude || !consumer.position.latitude || !consumer.radius) {
            return;
        }

        if (message && message.messageText) {
            message.receivedAt = Date();
            message.socketId = socket.id;

            storage.saveMessage(message)
                .then(function (message) {
                    socket.emit('newMessageReceived', message);

                    // emit newMessageReceived to users with appropriate position
                    broadcastToConsumersInRange.call({ io: this.io }, consumers, message);
                });
        }
    });

    socket.on('newPosition', function (consumer) {
        // reject consumer without position
        if (!consumer || !consumer.position || !consumer.position.longitude || !consumer.position.latitude || !consumer.radius) {
            return;
        }
        
        consumers[socket.id] = consumer;
        consumers[socket.id].updatedAt = Date();

        // get only new messages that were received after update
        storage.getMessages(consumer)
            .then(messages => {
                socket.emit("messagesDelivered", messages);
            });
    });

    socket.on('getHistory', function (offset) {
        let consumer = consumers[socket.id];
        
        // reject consumer without position
        if (!consumer || !consumer.position || !consumer.position.longitude || !consumer.position.latitude || !consumer.radius) {
            return;
        }
        
        // get only new messages that were received after update
        storage.getMessages(consumer, offset)
            .then(messages => {
                socket.emit("historyDelivered", messages);
            });
    });

    function broadcastToConsumersInRange(consumers, message) {
        Object.keys(consumers).forEach((socketId) => {
            if (geo.consumerIsInRange(consumers[socketId], message)) {
                socket.broadcast.to(socketId).emit('newMessageReceived', message);
            }
        });
    }
}

module.exports = socketsBase;