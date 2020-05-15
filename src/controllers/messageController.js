const CM = require('../models/chatModel')
const CA = require('../common/commonActions')

// Get user messages
const getUserMessages = (req, res) => {
    const loggedUser = CA.getLoggedUser(req)
    CM.find({ userId: loggedUser.userId, "messageList.friendId": req.params.friendId }, "messageList.$.messages", (err, messageData) => {
        if (err) res.json({ status: false, message: "Something went wrong" })
        else {
            res.json(messageData.length ? { status: true, messageList: messageData[0].messageList[0].messages } : { status: false, messageList: [] })
        }
    })
}

// Get message
const sendMessage = (req, res) => {
    const senderId = req.body.senderId
    const friendId = req.body.friendId
    const message = req.body.messageData
    CM.updateOne(
        { userId: senderId, "messageList.friendId": friendId },
        { $push: { "messageList.$.messages": { origin: 'self', message: message } } },
        err => {
            if (err) res.json({ status: false, message: "Something went wrong" })
            else {
                // Store user/other message
                CM.updateOne(
                    { userId: friendId, "messageList.friendId": senderId },
                    { $push: { "messageList.$.messages": { origin: 'other', message: message } } },
                    err => {
                        if (err) res.json({ status: false, message: "Something went wrong" })
                        else {
                            res.json({ status: true, message: "Message saved" })
                        }
                    }
                )
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
    deleteMessage
}