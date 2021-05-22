const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
        status: { type: String, default: "active" },
        messageList: [
            {
                _id: false,
                userId: { type: String, reqired: true },
                messages: [
                    {
                        origin: { type: String, reqired: true },
                        message: { type: String },
                        readStatus: { type: String, default: "unread" },
                        edited: { type: Boolean, default: false },
                        createdAt: { type: String, required: true, default: Date.now() },
                        editedAt: { type: String }
                    }
                ]
            }
        ]
    }
)

module.exports = mongoose.model("chat", chatSchema)