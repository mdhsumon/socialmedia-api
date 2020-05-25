const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    displayName: { type: String, required: true },
    nickName: { type: String },
    gender: { type: String, required: true },
    username: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String },
    userPass: { type: String, required: true },
    birthDate: { type: String },
    location: { type: String },
    about: { type: String },
    status: { type: String, default: "active" },
    friends: [
        {
            _id: false,
            friendId: { type: String },
            status: { type: String, default: "active" }
        }
    ],
    friendRequests: [
        {
            _id: false,
            senderId: { type: String },
            status: { type: String, default: "pending" }
        }
    ],
    sentRequests: [
        {
            _id: false,
            friendId: { type: String },
            status: { type: String, default: "pending" }
        }
    ],
    profilePhoto: { type: String },
    coverPhoto: { type: String }
})

// Default profile photo depending on gender
userSchema.pre('save', function(next) {
    if(!this.profilePhoto)
    this.profilePhoto = '/default/image/' + (this.gender == 'male' ? 'male.png' : 'female.png')
    if(!this.coverPhoto)
    this.coverPhoto = '/default/image/cover.png'
    next()
})

module.exports = mongoose.model('User', userSchema)
