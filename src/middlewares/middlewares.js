const CA = require("../common/commonActions")

// Check user and create token
const userLogin = (req, res) => {
    CA.userAuthorization(req.body.username, req.body.password, (status, userData) => {
        if (status) {
            const token = CA.createToken({
                userId: userData._id,
                username: userData.username
            })
            res.json({ status: true, _id: userData._id, accessToken: token, message: "Login successfull!" })
        } 
        else {
            res.json({ status: false, message: "Authorization failed" })
        }
    })
}

// User logout and destroy token
const userLogout = (req, res) => {
    if (true) {
        res.json({ status: true, message: "Logout successfull" })
    } 
    else {
        res.json({ status: false, message: "Authorization failed" })
    }
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
