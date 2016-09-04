let mongoose = require('mongoose');
mongoose.Promise = Promise;

module.exports = class database {
    constructor () {
        let self = this;
        mongoose.connect('mongodb://localhost/test3');

        let db = mongoose.connection;
        db.on('error', console.error.bind(console, 'mongo connection error:'));
        db.once('open', function() {
            // we're connected!
            console.log("connected to mongo");

            let messagesSchema = mongoose.Schema({
                messageText: String,
                receivedAt: Date,
                location : {
                    type: {
                        type: String,
                        default: 'Point'
                    },
                    coordinates: [Number]
                },
                position: {
                    latitude: Number,
                    longitude: Number,
                    accuracy: Number
                },
                socketId: String,
                userName: String
            });
            messagesSchema.index({ location : '2dsphere' });

            self.Message = mongoose.model('Message', messagesSchema);
        });
    }

    saveMessage (message) {
        // create GeoJSON object
        message.location = {
            coordinates: [message.position.longitude, message.position.latitude]
        };
        
        let newMessage = new this.Message(message);

        return newMessage.save()
            .catch(function errorHander(error) {
                console.log("message failed to save: " + error)
            });
    }

    getMessages (consumer, offset = 0) {
        let query = {
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [consumer.position.longitude, consumer.position.latitude]
                    },
                    $maxDistance: consumer.radius
                }
            }
        };

        return this.Message.find(query).sort('-receivedAt').skip(offset).limit(30).exec()
            .catch(function errorHander(error) {
                console.log("get messages failed: " + error)
            });
    }
}