const UM = require("../models/userModel")
const LM = require("../models/loginModel")
const CM = require("../models/chatModel")
const CA = require("../common/commonActions")
const FC = require("../controllers/fileController")
const formidable = require("formidable")

// Get username or email existency
const isUserExist = (req, res) => {
    if (req.params.type === "username") {
        UM.findOne({ username: req.params.userOrEmail }, (err, user) => {
            if (err) res.json({ status: false, message: "Something went wrong" })
            else user ? res.json({ status: true, message: "Username found" }) : res.json({ status: false, message: "No username found" })
        })
    }
    else if (req.params.type === "email") {
        UM.findOne({ userEmail: req.params.userOrEmail }, (err, user) => {
            if(err) res.json({ status: false, message: "Something went wrong" })
            else user ? res.json({ status: true, message: "Email found" }) : res.json({ status: false, message: "No Email found" })
        })
    }
    else {
        res.json({ message: "Bad request" })
    }
}

// Create new user
const createUser = (req, res) => {
    /* Username RegExp
    (?=.{5,20}$) 5-20 characters,
    [a-z] first charcter a-z,
    (?![_.]) no _ or . at the beginning,
    (?!.*[_.]{2}) no __ or _. or ._ or .. inside,
    ([a-z0-9]) a-z or 0-9 at the end,
    [a-z0-9._] allowed characters a-z and 0-9
    */

    const userRegEx = /^[a-z](?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-z0-9._]+([a-z0-9])$/
    /* Email RegExp */
    const emailRegEx = /[\w-]+@([\w-]+\.)+[\w-]+/
    const newUser = {
        displayName: req.body.displayName,
        gender: req.body.gender,
        username: req.body.username,
        userEmail: req.body.userEmail,
        userPass: req.body.userPass
    }
    const validation = userRegEx.test(newUser.username) && emailRegEx.test(newUser.userEmail) && newUser.userPass.length >= 6 && (newUser.gender === "male" || newUser.gender === "female")
    if (validation) {
        UM.find({ $or: [{ userEmail: newUser.userEmail }, { username: newUser.username }] },
            (err, user) => {
                if (err) res.json({ status: false, message: "Something went wrong" })
                else if (user.length > 0) {
                    res.json({ status: false, message: "Username or email already exists" })
                }
                else {
                    // Create new user
                    UM.create(newUser)
                    .then(added => added)
                    .then((data, error) => {
                        if(error) {
                            res.json({ status: false, message: "User not registered" })
                        }
                        else {
                            // Chat data initialization
                            CM.create({ _id: data._id }, err => {
                                if (err) res.json({ status: false, message: "User registered but Chat has not been initialised" })
                                else {
                                    // Login data initialization
                                    LM.create({ _id: data._id, username: data.username }, err => {
                                        if (err) res.json({ status: false, message: "User registered but Login has not initialised" })
                                        else {
                                            res.json({ status: true, message: "Congratulations! Registration successful" })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            }
        )
    }
    else {
        res.json({ status: false, message: "Invalid data provided" })
    }
}

// Get user summary by id or username
const getUserSummary = (req, res) => {
    // Separate ids and usernames
    const userOrId = { ids:[], usernames: [] }
    req.params.userOrId.split(",").map(item => {
        let user = item.trim()
        return CA.validateId(user) ? userOrId.ids.push(CA.toMongoId(user)) : userOrId.usernames.push(user)
    })
    UM.find(
        { $or: [{_id: {$in: userOrId.ids}}, {username: {$in: userOrId.usernames}}] },
        "username displayName nickName profilePhoto coverPhoto",
        (err, users) => {
            if(err) res.json({ status: false, message: "Invalid id or username" })
            else users.length ? res.json({ status: true, users }) : res.json({ status: false, message: "No user data found" })
        }
    )
}

// Get user by username or id
const getUser = (req, res) => {
    const query = CA.userOrId(req.params.userOrId)
    UM.findOne(query, "-userPass -__v", (err, user) => {
        if(err) res.json({ status: false, message: "Something went wrong" })
        else user ? res.json({ status: true, user }) : res.json({ status: false, message: "No user data found" })
    })
}

// Update user by username or id
const updateUser = (req, res) => {
    const loggedUser = CA.getLoggedUser(req)
    const query = CA.validateId(req.params.userOrId) ? { _id: req.params.userOrId } : { username: req.params.userOrId }
    const form = new formidable.IncomingForm()
    form.parse(req, (error, fields, files) => {
        if(files.newProfile || files.newCover) {
            const fileObj = files.newProfile ? files.newProfile : files.newCover
            const photoType = files.newProfile ? "profilePhoto" : "coverPhoto"
            FC.uploadFiles(fileObj, loggedUser.username, callback => {
                if(callback.uploaded.length) {
                    const newData = {
                        [photoType]: "/file/" + callback.uploaded[0]
                    }
                    UM.updateOne(query, newData, (err, raw) => {
                        if (err) res.json({ status: false, message: "Something went wrong" })
                        else {
                            res.json({ status: true, message: `${photoType} updated` })
                        }
                    })
                }
                else {
                    res.json({status: false, message: `File not allowed: ${callback.failed}`}) 
                }
            })
        }
        else {
            const newData = {
                displayName: fields.displayName ? fields.displayName : "",
                nickName: fields.nickName ? fields.nickName : "",
                userEmail: fields.userEmail ? fields.userEmail : "",
                userPhone: fields.userPhone ? fields.userPhone : "",
                birthDate: fields.birthDate ? fields.birthDate : "",
                location: fields.location ? fields.location : "",
                about: fields.about ? fields.about : ""
            }
            UM.updateOne(query, newData, (err, raw) => {
                if (err) res.json({ status: false, message: "Something went wrong" })
                else {
                    res.json({ status: true, message: "Profile information has been updated" })
                }
            })
        }
    })
}

// Delete user by username or id
const deleteUser = (req, res) => {
    const query = CA.userOrId(req.params.userOrId)
    UM.deleteOne(query, (err, user) => {
        if(err) res.json({ status: false, message: "Something went wrong" })
        else if(!user.deletedCount) res.json({ status: false, message: `User(${req.params.userOrId}) not found` })
        else res.json({ status: true, message: "User has been deleted" })
    })
}

// Get friend lists
const getFriendLists = (req, res) => {
    const query = CA.userOrId(req.params.userOrId)
    UM.findOne(query, "-_id friends", (err, user) => {
        if (err) res.json({ status: false, message: "Something went wrong" })
        else {
            user && user.friends.length > 0 ?
            res.json({status: true, friends: user.friends}) :
            res.json({status: false, message: "No friends found" })
        }
    })
}

// Get random friend suggestion
const getFriendSuggestions = (req, res) => {
    const userCount = 10
    const loggedUser = CA.getLoggedUser(req).userId
    UM.find(
    {
        status: "active",
        "friends.userId": { $ne: loggedUser },
        "friendRequests.userId": { $ne: loggedUser },
        "sentRequests.userId": { $ne: loggedUser }
    },
    "username displayName profilePhoto coverPhoto friends",
    )
    .limit(userCount)
    .exec((err, suggestions) => {
        if(err) res.json({ status: false, message: "Something went wrong" })
        else {
            if(suggestions) {
                const updatedSuggestions = []
                const loggedUserFriends = suggestions.filter(user => user._id == loggedUser)[0].friends
                // Skipped logged user
                const suggestionList = suggestions.filter(item => item._id != loggedUser)
                suggestionList.map(item => {
                    const mutual = []
                    item.friends.map(uf => {
                        loggedUserFriends.map(lf => {
                            if(uf.userId == lf.userId)
                            mutual.push(uf.userId)
                        })
                    })
                    updatedSuggestions.push({
                        _id: item._id,
                        displayName: item.displayName,
                        username: item.username,
                        profilePhoto: item.profilePhoto,
                        coverPhoto: item.coverPhoto,
                        mutualFriends: mutual
                    })
                    
                })
                res.json({ status: true, suggestions: updatedSuggestions })
            }
            else {
                res.json({ status: false, message: "No suggestion found" })
            }
        }
    })
}

// Get friend request list
const getFrinedRequests = (req, res) => {
    const query = CA.userOrId(req.params.userOrId)
    UM.findOne(query, "-_id friendRequests", (err, requests) => {
        if(err) res.json({ status: false, message: "Something went wrong" })
        else {
            requests && requests.friendRequests.length > 0 ?
            res.json({ status: true, requests: requests.friendRequests }) :
            res.json({ status: false, message: "No request found" })
        }
    })
}

// Get sent request list
const getSentRequests = (req, res) => {
    const query = CA.userOrId(req.params.userOrId)
    UM.findOne(query, "-_id sentRequests", (err, requests) => {
        if(err) res.json({ status: false, message: "Something went wrong" })
        else {
            requests && requests.sentRequests.length > 0 ?
            res.json({ status: true, requests: requests.sentRequests }) :
            res.json({ status: false, message: "No sent request found" })
        }
    })
}

// Send friend request
const sendFrinedRequest = (req, res) => {
    const senderId = CA.getLoggedUser(req).userId
    const toUserId = req.params.toUserId
    UM.findOne({_id: senderId}, "friends friendRequests sentRequests", (err, resUserData) => {
        if (err) res.json({ status: false, message: "Invalid id provided" })
        else {
            if(resUserData && senderId !== toUserId) {
                const isFriend = resUserData.friends.filter(item => item.userId === toUserId).length
                const isSent = resUserData.sentRequests.filter(item => item.userId === toUserId).length
                const isRequested = resUserData.friendRequests.filter(item => item.userId === toUserId).length
                if(isFriend) {
                    res.json({ status: false, message: "You are already friend" })
                }
                else if(isSent) {
                    res.json({ status: false, message: "You have already sent request" })
                }
                else if(isRequested) {
                    res.json({ status: false, message: "You have already got request from the user" })
                }
                else {
                    // Requested user friendRequests update
                    UM.updateOne(
                        { _id: toUserId, status: "active" },
                        { $push: { friendRequests: { userId: senderId } } },
                        (err, raw) => {
                            if(err || !raw.nModified) res.json({ status: false, message: "Error or invalid user or account is disabled" })
                            else {
                                // Sender sentRequests update
                                UM.updateOne(
                                    { _id: senderId },
                                    { $push: { sentRequests: { userId: toUserId } } },
                                    err => {
                                        if(err) res.json({ status: false, message: "Something went wrong on sender" })
                                        else {
                                            res.json({ status: true, message: "Friend request has sent" })
                                        }
                                    }
                                )
                            }
                        }
                    )
                }
            }
            else {
                res.json({ status: false, message: "Invalid user id" })
            }
        }
    })
}

// Accept friedn request
const acceptFrinedRequest = (req, res) => {
    const senderId = req.params.senderId
    const receiverId = CA.getLoggedUser(req).userId
    UM.findOne({ _id: receiverId }, "friends friendRequests sentRequests", (err, resUserData) => {
        if(err) res.json({ status: false, message: "Something went wrong" })
        else if(!resUserData) res.json({ status: false, message: "Invalid user id" })
        else {
            const isFriend = resUserData.friends.filter(item => item.userId === senderId).length
            const isSent = resUserData.sentRequests.filter(item => item.userId === senderId).length
            const isRequested = resUserData.friendRequests.filter(item => item.userId === senderId).length
            if (isFriend) {
                res.json({ status: false, message: "You are already friend" })
            }
            else if (isSent) {
                res.json({ status: false, message: "You have already sent request" })
            }
            else if (!isRequested) {
                res.json({ status: false, message: "You have no friend request with the user" })
            }
            else {
                // Update receiver
                UM.updateOne(
                    { _id: receiverId },
                    { 
                        $pull: { friendRequests: { userId: senderId } },
                        $push: { friends: { _id: null, userId: senderId } }
                    },
                    err => {
                        if (err) res.json({ status: false, message: "Something went wrong on receiver" })
                        else {
                            // Update sender sentRequests
                            UM.updateOne(
                                { _id: senderId },
                                {
                                    $pull: { sentRequests: { userId: receiverId } },
                                    $push: { friends: { userId: receiverId } }
                                },
                                err => {
                                    if (err) res.json({ status: false, message: "Something went wrong on sender" })
                                    else {
                                        // Chat initialization receiver
                                        CM.updateOne(
                                            { _id: receiverId, "messageList.userId": { $ne: senderId } },
                                            { $push: { messageList: { userId: senderId } } },
                                            err => {
                                                if(err) res.json({ status: false, message: "Something went wrong on chat initialization" })
                                                else {
                                                    // Chat initialization sender
                                                    CM.updateOne(
                                                        { _id: senderId, "messageList.userId": { $ne: receiverId } },
                                                        { $push: { messageList: { userId: receiverId } } },
                                                        err => {
                                                            if(err) res.json({ status: false, message: "Something went wrong on chat initialization" })
                                                            else {
                                                                res.json({ status: true, message: "Friend request has accepted" })
                                                            }
                                                        }
                                                    )
                                                }
                                            }
                                        )
                                    }
                                }
                            )
                        }
                    }
                )
            }
        }
    })
}

// Decline friend request
const declineFrinedRequest = (req, res) => {
    const senderId = req.params.toUserId
    const rejectorId = CA.getLoggedUser(req).userId
    UM.updateOne(
        { _id: rejectorId },
        { friendRequests: { $pull: { userId: senderId } } },
        (err, raw) => {
            if(err || !raw.nModified) res.json({ status: false, message: "Error or request not found" })
            else {
                // Update sender sentRequests
                UM.updateOne(
                    { _id: senderId },
                    { sentRequests: { $pull: { userId: rejectorId } } },
                    err => {
                        if(err) res.json({ status: false, message: "Something went wrong" })
                        else {
                            res.json({ status: true, message: "Friend request declined" })
                        }
                    }
                )
            }
        }
    )
}

// Cancel friend request
const cancelFrinedRequest = (req, res) => {
    const toUserId = req.params.toUserId
    const rejectorId = CA.getLoggedUser(req).userId
    UM.updateOne(
        { _id: rejectorId },
        { sentRequests: { $pull: { userId: toUserId } } },
        (err, raw) => {
            if(err || !raw.nModified) res.json({ status: false, message: "Error or request not found" })
            else {
                // Update to user friendRequests
                UM.updateOne(
                    { _id: toUserId },
                    { friendRequests: { $pull: { userId: rejectorId } } },
                    err => {
                        if(err) res.json({ status: false, message: "Something went wrong" })
                        else {
                            res.json({ status: true, message: "Friend request declined" })
                        }
                    }
                )
            }
        }
    )
}

module.exports = {
    isUserExist,
    createUser,
    getUserSummary,
    deleteUser,
    getUser,
    updateUser,
    getFriendSuggestions,
    getFriendLists,
    getSentRequests,
    getFrinedRequests,
    sendFrinedRequest,
    acceptFrinedRequest,
    declineFrinedRequest,
    cancelFrinedRequest
}