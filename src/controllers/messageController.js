const CM = require('../models/chatModel')
const CA = require('../common/commonActions')
const UM = require('../models/userModel')

// Get user all messages
const getUserMessages = (req, res) => {
    const loggedUser = CA.getLoggedUser(req)
    CM.find(
        { userId: loggedUser.userId,  "messageList.friendId": req.params.friendId },
        "messageList.messages",
        (err, messageData) => {
            if (err) res.json({ status: false, message: "Something went wrong" })
            else {
                res.json(messageData.length ?
                    { status: true, messageList: messageData[0].messageList[0].messages } :
                    { status: false, message: "No message found" }
                )
            }
        }
    )
}

// Send message
const sendMessage = (req, res) => {
    const senderId = CA.getLoggedUser(req).userId
    const friendId = req.body.friendId
    const message = req.body.message
    UM.findOne({ _id: senderId}, "friends", (err, senderFriends) => {
        if (err) res.json({ status: false, message: "Something went wrong on find friend" })
        else {
            const isFriend = senderFriends.friends.filter(f => f.friendId === friendId).length
            if(isFriend) {
                CM.updateOne(
                    { userId: senderId, "messageList.friendId": friendId },
                    { $push: { "messageList.$.messages": { origin: "self", message: message } } },
                    err => {
                        if (err) res.json({ status: false, message: "Something went wrong on sender" })
                        else {
                            // Store user/other message
                            CM.updateOne(
                                { userId: friendId, "messageList.friendId": senderId },
                                { $push: { "messageList.$.messages": { origin: "other", message: message } } },
                                (err, raw) => {
                                    if (err) res.json({ status: false, message: "Something went wrong on other" })
                                    else {
                                        res.json({ status: true, message: "Message has been sent" })
                                    }
                                }
                            )
                        }
                    }
                )
            }
            else {
                res.json({ status: false, message: "You are not friend with the user" })
            }
        }
    })
}

// Edit message
const editMessage = (req, res) => {
    const messageId = req.body.messageId
    const message = req.body.messageData
    CM.updateOne(
        { userId: senderId, "messageList.friendId": friendId },
        { $push: { "messageList.$.messages": { origin: 'self', message: message } } },
        err => {
            if (err) res.json({ status: false, message: "Something went wrong" })
            else {
                res.json({ status: true, message: "Message updated" })
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
        if (err) res.json({ status: false, message: "Something went wrong" })
        else {
            res.json({ status: true, message: "Message has been deleted" })
        }
    })
}

module.exports = {
    getUserMessages,
    sendMessage,
    editMessage,
    deleteMessage
}