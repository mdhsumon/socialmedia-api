const CA = require("../common/commonActions")
const LM = require("../models/loginModel")

// Check user and create token
const userLogin = (req, res) => {
    CA.userAuthorization(req.body.username, req.body.password, (status, userData) => {
        if (status) {
            const tokenExpire = "12h"
            const token = CA.createToken(
                { userId: userData._id, username: userData.username },
                { expiresIn: tokenExpire }
            )
            // Store login data
            LM.updateOne(
                {_id: userData._id},
                {
                    username: userData.username,
                    accessToken: token,
                    tokenExpire: tokenExpire,
                    lastLogin: Date.now().toString(),
                    onlineStatus: "online"
                },
                err => {
                    if(err) res.json({ status: false, message: "Something went wrong" })
                    else {
                        res.json({ status: true, _id: userData._id, accessToken: token, message: "Login successfull!" })
                    }
                }
            )
        } 
        else {
            res.status(404).json({ status: false, message: "Authorization failed" })
        }
    })
}

// User logout and destroy token
const userLogout = (req, res) => {
    const loggedUserId = CA.getLoggedUser(req).userId
    // Remove login data
    LM.updateOne(
        {_id: loggedUserId},
        {
            accessToken: "",
            tokenExpire: "",
            lastLogout: Date.now().toString()
        },
        err => {
            if(err) res.json({ status: false, message: "Something went wrong" })
            else {
                res.json({ status: true, message: "Logout successfull" })
            }
        }
    )
}

// Verify user token
const checkUserToken = (req, res, next) => {
    if(req.headers.authorization) {
        const userToken = req.headers.authorization.split(" ")[1]
        CA.verifyToken(userToken, {}, status => {
            status ? next() : res.json({message: "Invalid or expired token"})
        })
    }
    else {
        res.json({message: "Token is not sent with header"})
    }
}

module.exports = {
    userLogin,
    userLogout,
    checkUserToken
}
