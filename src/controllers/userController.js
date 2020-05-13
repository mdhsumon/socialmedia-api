const UM = require('../models/userModel')
const CM = require('../models/chatModel')
const CA = require('../common/commonActions')
const FC = require('../controllers/fileController')
const formidable = require('formidable')

// Get username or email existency
const isUserExist = (req, res) => {
    if (req.params.type === "username") {
        UM.findOne({ username: req.params.userOrEmail }, (err, user) => {
            if (err) throw err
            else user ? res.json({ status: true, message: "Username found" }) : res.json({ status: false, message: "No username found" })
        })
    }
    else if (req.params.type === "email") {
        UM.findOne({ userEmail: req.params.userOrEmail }, (err, user) => {
            if (err) throw err
            else user ? res.json({ status: true, message: "Email found" }) : res.json({ status: false, message: "No Email found" })
        })
    }
    else {
        res.json({ message: "Bad request" })
    }
}

// Create new user
const createUser = (req, res) => {
    /* username RegExp
    (?=.{5,20}$) 5-20 characters,
    [a-z] first charcter a-z,
    (?![_.]) no _ or . at the beginning,
    (?!.*[_.]{2}) no __ or _. or ._ or .. inside,
    ([a-z0-9]) a-z or 0-9 at the end,
    [a-z0-9._] allowed characters a-z and 0-9
    */

    const userRegEx = /^[a-z](?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-z0-9._]+([a-z0-9])$/
    /* email RegExp */
    const emailRegEx = /[\w-]+@([\w-]+\.)+[\w-]+/
    const newUser = {
        displayName: req.body.displayName,
        gender: req.body.gender,
        username: req.body.username,
        userEmail: req.body.userEmail,
        userPass: req.body.userPass
    }
    const validation = userRegEx.test(newUser.username) && emailRegEx.test(newUser.userEmail) && newUser.userPass.length >= 6 && (newUser.gender === 'male' || newUser.gender === 'female')
    if (validation) {
        UM.find({ $or: [{ userEmail: newUser.userEmail }, { username: newUser.username }] }, (err, user) => {
            if (err) throw err
            else if (user.length > 0) {
                res.json({ status: false, message: "Username or email already exists" })
            }
            else {
                // Initialized new user folders
                const createStatus = FC.createNewUserFolder(newUser.username)
                if(createStatus) {
                    // Create new user
                    UM.create(newUser, err => {
                        if (err) throw err
                        else {
                            res.json({ status: true, message: "Congratulations! New user created" })
                        }
                    })
                }
                else {
                    console.log(createStatus)
                    res.json({ status: false, message: "File write permission denied" })
                }
            }
        })
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

    UM.find({$or: [{_id: {$in: userOrId.ids}}, {username: {$in: userOrId.usernames}}]}, "username displayName nickName profilePhoto coverPhoto", (err, users) => {
        if (err) {
            res.json({ status: false, message: "Invalid id or username" })
        }
        else {
            if (users.length) {
                users.length > 1 ? res.json({ status: true, users }) : res.json({ status: true, users })
            }
            else {
               res.json({ status: false, message: "No user data found" })
            }
        }
    })
}

// Get user by username or id
const getUser = (req, res) => {
    const query = CA.validateId(req.params.userOrId) ? { _id: req.params.userOrId } : { username: req.params.userOrId }
    UM.findOne(query, "-userPass -__v", (err, user) => {
        if (err) throw err
        else {
            if (user) {
                res.json({ status: true, user })
            }
            else {
                res.json({ status: false, message: "No user data found" })
            }
        }
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
            FC.uploadFiles(fileObj, loggedUser.username, uploadedPath => {
                if(uploadedPath) {
                    const newData = {
                        [photoType]: uploadedPath[0]
                    }
                    UM.updateOne(query, newData, (err, raw) => {
                        if (err) throw err
                        else {
                            res.json({ status: true, message: `${photoType} updated` })
                        }
                    })
                }
            })
        }
        else {
            const newData = {
                displayName: fields.displayName ? fields.displayName : '',
                nickName: fields.nickName ? fields.nickName : '',
                userEmail: fields.userEmail ? fields.userEmail : '',
                userPhone: fields.userPhone ? fields.userPhone : '',
                birthDate: fields.birthDate ? fields.birthDate : '',
                location: fields.location ? fields.location : '',
                about: fields.about ? fields.about : ''
            }
            UM.updateOne(query, newData, (err, raw) => {
                if (err) throw err
                else {
                    res.json({ status: true, message: "Profile information has been updated" })
                }
            })
        }
    })
}

// Delete user by username or id
const deleteUser = (req, res) => {
    const query = CA.userOrId(req)
    UM.deleteOne(query, (err, user) => {
        if (err) throw err
        else if (!user.deletedCount) res.json({ status: false, message: `User(${req.params.userOrId}) not found` })
        else res.json({ status: true, message: "User has been deleted" })
    })
}

// Get random friend suggestion
const getFriendSuggestions = (req, res) => {
    const skipId = CA.getLoggedUser(req).userId
    UM.find({
        _id: { $ne: skipId },
        "friends.friendId": { $ne: skipId },
        "friendRequests.senderId": { $ne: skipId },
        "sentRequests.friendId": { $ne: skipId }
    },
        '_id username displayName profilePhoto coverPhoto',
    )
    .limit(50)
    .exec((err, suggestions) => {
        if (err) throw err
        else {
            if(suggestions) {
                res.json({ status: true, suggestions })
            }
            else {
                res.json({ status: false, message: "No suggestion found" })
            }
        }
    })
}

// Get friend lists
const getFriendLists = (req, res) => {
    const query = CA.userOrId(req)
    UM.findOne(query, '-_id friends', (err, user) => {
        if (err) throw err
        else {
            user && user.friends.length > 0 ? res.json({status: true, friends: user.friends}) : res.json({status: false, message: "No friends found" })
        }
    })
}

// Update user profile
const getFrinedRequests = (req, res) => {
    const query = CA.userOrId(req)
    UM.findOne(query, '-_id friendRequests', (err, requests) => {
        if (err) throw err
        else {
            requests && requests.friendRequests.length > 0 ? res.json({ status: true, requests: requests.friendRequests }) : res.json({ status: false, message: "No request found" })
        }
    })
}

// Get friedn request
const sendFrinedRequest = (req, res) => {
    const senderId = req.body.senderId
    const toUser = req.body.toUser
    UM.findOne({ username: toUser }, 'friends friendRequests', (err, resUserData) => {
        if (err) throw err
        else {
            const friendCount = resUserData.friends.filter(item => item.friendId === senderId).length
            const requestCount = resUserData.friendRequests.filter(item => item.senderId === senderId).length
            if (friendCount) {
                res.json({ status: false, message: "You are already friend" })
            }
            else if (requestCount) {
                res.json({ status: false, message: "You have already requested" })
            }
            else {
                // Requested user friendRequests update
                UM.updateOne(
                    { username: toUser },
                    {
                        $push: {
                            friendRequests: { senderId: senderId }
                        }
                    },
                    err => {
                        if (err) throw err
                        else {
                            // Geter sentRequests update
                            UM.updateOne(
                                { _id: senderId },
                                {
                                    $push: {
                                        sentRequests: { friendId: resUserData._id }
                                    }
                                },
                                err => {
                                    if (err) throw err
                                    else {
                                        res.json({ status: true, message: "Friend request has sent" })
                                    }
                                })
                        }
                    })
            }
        }
    })
}

// Accept friedn request
const acceptFrinedRequest = (req, res) => {
    const senderId = req.body.senderId
    const loggedUser = CA.getLoggedUser(req)
    UM.findOne({ username: loggedUser.username }, 'friends friendRequests', (err, resUserData) => {
        if (err) throw err
        else {
            if (resUserData.friends.filter(friend => friend.friendId === senderId).length <= 0) {
                UM.updateOne(
                    { _id: resUserData._id },
                    {
                        $pull: {
                            friendRequests: { senderId: senderId }
                        },
                        $push: {
                            friends: { _id: null, friendId: senderId }
                        }
                    },
                    err => {
                        if (err) throw err
                        else {
                            // Update sender sentRequests
                            UM.updateOne(
                                { _id: senderId },
                                {
                                    $pull: {
                                        sentRequests: { friendId: resUserData._id }
                                    },
                                    $push: {
                                        friends: { friendId: resUserData._id }
                                    }
                                },
                                err => {
                                    if (err) throw err
                                    else {
                                        res.json({ status: true, message: "Friend request has accepted" })
                                    }
                                }
                            )
                        }
                    })
            }
            else {
                res.json({ status: false, message: "Friend request has already been accepted" })
            }
        }
    })
}

// Decline friedn request
const declineFrinedRequest = (req, res) => {
    const senderId = req.body.senderId
    const loggedUser = CA.getLoggedUser(req)
    UM.findOne({ username: loggedUser.username }, 'friendRequests', (err, resUserData) => {
        if (err) throw err
        else {
            // Update user friendRequests
            UM.updateOne(
                { _id: resUserData._id },
                {
                    friendRequests: {
                        $pull: { senderId: senderId }
                    }
                },
                err => {
                    if (err) throw err
                    else {
                        // Find sender sentRequests
                        UM.findOne({ _id: senderId }, 'sentRequests', (err, senderUser) => {
                            if (err) throw err
                            else {
                                // FUpdate sender sentRequests
                                UM.updateOne(
                                    { _id: senderUser._id },
                                    {
                                        sentRequests: {
                                            $pull: { senderId: resUserData._id }
                                        }
                                    },
                                    err => {
                                        if (err) throw err
                                        else {
                                            res.json({ status: true, message: "Friend request declined" })
                                        }
                                    }
                                )
                            }
                        })
                    }
                }
            )
        }
    })
}

// Get user messages
const getUserMessages = (req, res) => {
    const loggedUser = CA.getLoggedUser(req)
    CM.find({ userId: loggedUser.userId, "messageList.friendId": req.params.friendId }, "messageList.$.messages", (err, messageData) => {
        if (err) throw err
        else {
            res.json(messageData.length ? { status: true, messageList: messageData[0].messageList[0].messages } : { status: false, messageList: [] })
        }
    })
}

// Get message
const sendMessage = (req, res) => {
    const senderId = req.body.senderId
    const friendId = req.body.friendId
    const messageData = req.body.messageData

    const storeMessage = message => {
        // Store sender/self message
        CM.updateOne(
            { userId: senderId, "messageList.friendId": friendId },
            { $push: { "messageList.$.messages": { origin: 'self', message: message } } },
            err => {
                if (err) throw err
                else {
                    // Store user/other message
                    CM.updateOne(
                        { userId: friendId, "messageList.friendId": senderId },
                        { $push: { "messageList.$.messages": { origin: 'other', message: message } } },
                        err => {
                            if (err) throw err
                            else {
                                res.json({ status: true, message: "Message saved" })
                            }
                        }
                    )
                }
            }
        )
    }

    CM.find({ userId: { $in: [senderId, friendId] } }, (err, users) => {
        if (err) throw err
        else {
            if (users.length <= 0) {
                CM.create([,
                    { _id: null, userId: senderId, messageList: { friendId: friendId } },
                    { _id: null, userId: friendId, messageList: { friendId: senderId } }
                ],
                (err, couple) => {
                    if (err) throw err
                    else {
                        //res.json({ message: "Couple user initialized" })
                        storeMessage(messageData)
                    }
                })
            }
            else if (users.length == 1) {
                const singleId = users[0].userId === senderId ? friendId : senderId
                const reverseSingleId = users[0].userId === senderId ? senderId : friendId
                CM.create({ _id: null, userId: singleId, messageList: { friendId: reverseSingleId } }, (err, single) => {
                    if (err) throw err
                    else {
                        CM.updateOne(
                            { userId: senderId },
                            { $push: { messageList: { friendId: friendId } } },
                            err => {
                                if (err) throw err
                                else {
                                    //res.json({ message: "Single user initialized" })
                                    storeMessage(messageData)
                                }
                            })
                    }
                })
            }
            else {
                storeMessage(messageData)
            }
        }
    }
    )
}

// Get message
const deleteMessage = (req, res) => {
    const loggedUser = CA.getLoggedUser(req)
    CM.updateOne(
        { userId: loggedUser.userId, "messageList.friendId": req.body.friendId  },
        { $pull: {"messageList.$.messages": {_id: req.body.messageId}} }, (err, raw) => {
        if (err) throw err
        else {
            res.json({ status: true, message: "Message has been deleted" })
        }
    })
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
    getFrinedRequests,
    sendFrinedRequest,
    acceptFrinedRequest,
    declineFrinedRequest,
    getUserMessages,
    sendMessage,
    deleteMessage
}