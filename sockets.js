let database = require('./storage');
let geo = require('./geolocation');
let consumers = {};
let storage = new database();

function socketsBase() {
    this.io.on('connection', socketsHandler.bind({ io: this.io }));
}

function socketsHandler(socket){
    console.log('a user joined');
    console.log('socketId: ' + socket.id);

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
                    console.log("SAVED MESSAGE: " + JSON.stringify(message));
                    
                    // emit newMessageReceived to sender
                    socket.emit("newMessageReceived", message);
                    
                    // emit newMessageReceived to users with appropriate position
                    broadcastToConsumersInRange.call({ io: this.io }, consumers, message);
                });
        }
    });

    socket.on('newPosition', function (consumer) {
        console.log('new position from ' + socket.id);

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

    
}

function broadcastToConsumersInRange(consumers, message) {
    Object.keys(consumers).forEach((socketId) => {
        if (geo.consumerIsInRange(consumers[socketId], message)) {
            this.io.to(socketId).emit('newMessage', message);
        }
    });
}

module.exports = socketsBase;