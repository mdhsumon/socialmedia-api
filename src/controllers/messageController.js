const CM = require("../models/chatModel")
const CA = require("../common/commonActions")
const UM = require("../models/userModel")

// Get user all messages
const getUserMessages = (req, res) => {
    const loggedUser = CA.getLoggedUser(req).userId
    CM.find(
        { _id: loggedUser,  "messageList.userId": req.params.friendId },
        "messageList.$.messages",
        (err, messageData) => {
            if(err) res.json({ status: false, message: "Something went wrong" })
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
    const timestamp = Date.now()
    CM.updateOne(
        { _id: senderId, "messageList.userId": friendId },
        { $push: { "messageList.$.messages": { messageId: timestamp, origin: "self", message: message, time: timestamp } } },
        (err, raw) => {
            if(err) res.json({ status: false, message: "Something went wrong on sender" })
            else if(!raw.n) res.json({ status: false, message: "Invalid friend id" })
            else {
                // Store user/other message
                CM.updateOne(
                    { _id: friendId, "messageList.userId": senderId },
                    { $push: { "messageList.$.messages": { messageId: timestamp, origin: "other", message: message, time: timestamp } } },
                    err => {
                        if(err) res.json({ status: false, message: "Something went wrong on other" })
                        else {
                            res.json({ 
                                status: true,
                                messageData: {
                                    _id: timestamp,
                                    origin: "self",
                                    message: message,
                                    time: timestamp,
                                    readStatus: "unread",
                                    edited: false
                                }
                            })
                        }
                    }
                )
            }
        }
    )
}

// Edit message
const editMessage = (req, res) => {
    const senderId = CA.getLoggedUser(req).userId
    const friendId = req.body.friendId
    const messageId = req.body.messageId
    const message = req.body.message
    CM.updateOne(
        { _id: senderId },
        { $set: {
            "messageList.$[f].messages.$[m].message": message,
            "messageList.$[f].messages.$[m].edited": true }
        },
        { arrayFilters: [{"f.friendId": friendId}, {"m.messageId": messageId}] },
        (err, raw) => {
            if(err) res.json({ status: false, message: "Something went wrong" })
            else if(!raw.nModified) res.json({ status: false, message: "Message not updated" })
            else {
                CM.updateOne(
                    { _id: friendId },
                    { $set: {
                        "messageList.$[f].messages.$[m].message": message,
                        "messageList.$[f].messages.$[m].edited": true }
                    },
                    { arrayFilters: [{"f.friendId": friendId}, {"m.messageId": messageId}] },
                    (err, raw) => {
                        if(err) res.json({ status: false, message: "Something went wrong" })
                        else if(!raw.nModified) res.json({ status: false, message: "Message not updated" })
                        else {
                            res.json({ status: true, message: "Message updated" })
                        }
                    }
                )
            }
        }
    )
}

// Get message
const deleteMessage = (req, res) => {
    const loggedUser = CA.getLoggedUser(req).userId
    CM.updateOne(
        { _id: loggedUser, "messageList.userId": req.body.friendId  },
        { $pull: {"messageList.$.messages": {_id: req.body.messageId}} },
        (err, raw) => {
            if(err) res.json({ status: false, message: "Something went wrong" })
            else {
                res.json({ status: true, message: "Message has been deleted" })
            }
        }
    )
}

module.exports = {
    getUserMessages,
    sendMessage,
    editMessage,
    deleteMessage
}