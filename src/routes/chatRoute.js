const MC = require('../controllers/messageController')
const MW = require('../middlewares/middlewares')
const messageRoutes = app => {
    // Get user messages against frined id.
    app.get('/messages/:friendId', MW.checkUserToken, MC.getUserMessages)

    app.route('/message')
    // Send message. sample request body {"senderId": "_id", friendId: "_id", messageData: "" }
    app.post(MW.checkUserToken, MC.sendMessage)

    // Edit message. sample request body {messageId: "_id", messageData: "" }
    app.put(MW.checkUserToken, MC.editMessage)

    // Delete message. sample request body {"friendId": "_id", messageId: "_id" }
    app.delete(MW.checkUserToken, MC.deleteMessage)
}

module.exports = messageRoutes