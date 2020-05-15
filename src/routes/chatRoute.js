const MC = require('../controllers/messageController')
const MW = require('../middlewares/middlewares')
const messageRoutes = app => {
    // Get user messages by frined id.
    app.get('/messages/:friendId', MW.checkUserToken, MC.getUserMessages)

    // Send message. sample request body {"senderId": "_id value", friendId: "_id value", messageData: "" }
    app.post('/message/send', MW.checkUserToken, MC.sendMessage)

    // Delete message. sample request body {"friendId": "_id value", messageId: "_id value" }
    app.delete('/message/delete', MW.checkUserToken, MC.deleteMessage)
}

module.exports = messageRoutes
