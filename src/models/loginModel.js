const mongoose = require("mongoose")

const loginSchema = new mongoose.Schema({
    username: { type: String, required: true },
    tryCount: { type: Number, default: 0 },
    accessToken: { type: String },
    tokenExpire: { type: String },
    lastLogin: { type: String },
    lastLogout: { type: String }
})

module.exports = mongoose.model("Login", loginSchema)
