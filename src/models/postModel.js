const mongoose = require("mongoose")
const postSchema = new mongoose.Schema({
        visibility: { type: String, require: true, default: "public" },
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
            likes: {
                count: { type: Number, default: 0 },
                users: [
                    {
                        _id: false,
                        userId: { type: String },
                        reaction: { type: String, defult: 'like' }
                    }
                ]
            },
            dislikes: {
                count: { type: Number, default: 0 },
                users: [
                    {
                        _id: false,
                        userId: { type: String },
                        reaction: { type: String, defult: 'dislike' }
                    }
                ]
            }
        },
        comments: [
            {
                commentedAt: { type: String, default: Date.now },
                updatedAt: { type: String },
                userId: { type: String, required: true },
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
