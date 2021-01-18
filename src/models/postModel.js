const mongoose = require("mongoose")
const postSchema = new mongoose.Schema({
        visibility: { type: String, required: true, default: "public" },
        userInfo: {
            userId: { type: String, required: true },
            username: { type: String, required: true }
        },
        content: {
            message: { type: String },
            attachment: {
                photos: [{ path: { type: String } }],
                videos: [{ path: { type: String } }],
                files: [{ path: { type: String } }]
            }
        },
        reactions: {
            count: { type: Number, default: 0 },
            likes: [{ _id: false, userId: {type: String}, data: {type: String} }],
            emojis: [{ _id: false,  userId: {type: String}, data: {type: String} }],
        },
        comments: [
            {
                userId: { type: String, required: true },
                commentedAt: { type: String, default: Date.now },
                updatedAt: { type: String },
                message: { type: String },
                replies: [
                    {
                        userId: { type: Number },
                        message: { type: String }
                    }
                ]
            }
        ],
        createdAt: { type: String, default: Date.now },
        lastUpdatedAt: { type: String, default: Date.now }
    }
)
module.exports = mongoose.model('Post', postSchema)
