const MC = require('../controllers/messageController')
const MW = require('../middlewares/middlewares')
const messageRoutes = app => {
    // Get user messages against frined id.
    app.get('/messages/:friendId', MW.checkUserToken, MC.getUserMessages)

    app.route('/message')

    // Send message. Sample request body {friendId: "xxx", message: "" }
    .post(MW.checkUserToken, MC.sendMessage)

    // Edit message. sample request body {messageId: "xxx", message: "" }
    .put(MW.checkUserToken, MC.editMessage)

    // Delete message. Sample request body {"friendId": "xxx", messageId: "xxx" }
    .delete(MW.checkUserToken, MC.deleteMessage)
}

module.exports = messageRoutes