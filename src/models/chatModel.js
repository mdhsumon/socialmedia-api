const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
        status: { type: String, default: "active" },
        messageList: [
            {
                _id: false,
                userId: { type: String, reqired: true },
                messages: [
                    {
                        messageId: { type: String, required: true },
                        origin: { type: String, reqired: true },
                        message: { type: String },
                        readStatus: { type: String, default: "unread" },
                        edited: { type: Boolean, default: false },
                        time: { type: String, required: true, default: Date.now() }
                    }
                ]
            }
        ]
    }
)

module.exports = mongoose.model("chat", chatSchema)