const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    nickName: { type: String },
    profilePhoto: { type: String },
    coverPhoto: { type: String },
    gender: { type: String, required: true },
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
            userId: { type: String },
            status: { type: String, default: "active" }
        }
    ],
    friendRequests: [
        {
            _id: false,
            userId: { type: String },
            status: { type: String, default: "pending" }
        }
    ],
    sentRequests: [
        {
            _id: false,
            userId: { type: String },
            status: { type: String, default: "pending" }
        }
    ]
})

// Default profile photo depending on gender
userSchema.pre("save", function(next) {
    if(!this.profilePhoto)
    this.profilePhoto = "/file/default/" + (this.gender == "male" ? "male.png" : "female.png")
    if(!this.coverPhoto)
    this.coverPhoto = "/file/default/cover.png"
    // Hashed password
    const saltRound = 69
    bcrypt.hash(this.userPass, saltRound, (err, hasedPass) => {
        if(err) return next(err)
        else {
            this.userPass = hasedPass
        }
        next()
    })
    next()
})

module.exports = mongoose.model("User", userSchema)
