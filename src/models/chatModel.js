const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
        _id: { type: Number },
        userId: { type: String },
        status: { type: String, default: 'active' },
        messageList: [
            {
                _id: false,
                friendId: { type: String, reqired: true },
                messages: [
                    {
                        origin: { type: String, reqired: true },
                        message: { type: String },
                        readStatus: { type: String, default: 'unread' },
                        time: { type: String, default: Date.now() }
                    }
                ]
            }
        ]
    },
    { timestamps: true }
)

module.exports = mongoose.model('chat', chatSchema)