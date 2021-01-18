const UM = require("../models/userModel")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")

// User authorisation by Email and Password.
const userAuthorization = (user, password, callback) => {
    UM.findOne({"username": user}, "username userPass", (err, resData) => {
        if(err) throw err
        else {
            if(password == resData.userPass){
                callback(true, resData)
            }
            else {
                callback(false)
            }
        }
    })
}

// Token generator
const createToken = (tokenPayload, options) => {
    const jwtSecrecKey = "tokensecrectkey"
    const defaults = {
        expiresIn: "30m"
    }
    const config = {...defaults, ...options}
    return jwt.sign(tokenPayload, jwtSecrecKey, config)
}

// Verify user token
const verifyToken = (token, verifyOptions, callback) => {
    const jwtSecrecKey = "tokensecrectkey"
    tokenOptions = {
    } 
    jwt.verify(token, jwtSecrecKey, verifyOptions, (err, decoded) => {
        callback(err ? false: true)
    })
}

// Logged user info
const getLoggedUser = req => {
    const userToken = req.headers.authorization.split(" ")[1]
    return jwt.decode(userToken)
}

// Clone js object
const cloneObject = obj => JSON.parse(JSON.stringify(obj))

// Verify request id
const validateId = id => {
    return mongoose.Types.ObjectId.isValid(id) ? true : false
}

// Convert string to id
const toMongoId = strId => {
    return mongoose.Types.ObjectId(strId)
}

// Query generator for username or id
const userOrId = user => {
    return validateId(user) ? { _id: user } : { username: user }
}

module.exports = {
    userAuthorization,
    createToken,
    verifyToken,
    getLoggedUser,
    cloneObject,
    validateId,
    toMongoId,
    userOrId
}