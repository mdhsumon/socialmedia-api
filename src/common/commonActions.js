const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")

// User authorisation by Email and Password.
const userAuthorization = (user, password, callback) => {
    userModel.findOne({ username: user }, (err, resData) => {
        if(err) throw err
        else {
            if(resData){
                callback(status = password == resData.userPass ? true : false, resData)
            }
            else {
                callback(false)
            }
        }
    })
}

// Token generator
const createToken = (tokenPayload, tokenOptions) => {
    const jwtSecrecKey = "tokensecrectkey"
    tokenOptions = {
        expiresIn: "12h"
    } 
    return jwt.sign(tokenPayload, jwtSecrecKey, tokenOptions)
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

// Verify user token
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
const userOrId = req => {
    return validateId(req.params.userOrId) ? { _id: req.params.userOrId } : { username: req.params.userOrId }
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