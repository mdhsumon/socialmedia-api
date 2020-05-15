const UC = require('../controllers/userController')
const MW = require('../middlewares/middlewares')
const userRoutes = app => {

    // Create new user
    app.post('/signup', UC.createUser)

    // User login and return access token
    app.post('/login', MW.userLogin)

    // User logout
    app.get('/logout', MW.userLogout)

    // Check username or email exist or not
    app.get('/check/:type/:userOrEmail', UC.isUserExist)

    // Get single/multiple user basic info by id or username. like /a,b,c if multiple
    app.get('/user/summary/:userOrId', MW.checkUserToken, UC.getUserSummary)

    // User operation by username or user id
    app.route('/user/:userOrId')

    // Get user
    .get(MW.checkUserToken, UC.getUser)

    // Update user
    .put(MW.checkUserToken, UC.updateUser)

    // Delete user
    .delete(MW.checkUserToken, UC.deleteUser)

    // Get random friend suggestion
    app.get('/friend/suggestions', MW.checkUserToken, UC.getFriendSuggestions)

    // Get friend request list
    app.get('/:userOrId/friends', MW.checkUserToken, UC.getFriendLists)

    // Get friend request list
    app.get('/:userOrId/requests', MW.checkUserToken, UC.getFrinedRequests)

    // Send friend request. sample request body {"toUser": "username","senderId": "xxx"}
    app.put('/request/send', MW.checkUserToken, UC.sendFrinedRequest)

    // Accept friend request. sample request body {"senderId": "xxx"}
    app.put('/request/accept', MW.checkUserToken, UC.acceptFrinedRequest)

    // Decline friend request. sample request body {"senderId": "xxx"}
    app.put('/request/decline', MW.checkUserToken, UC.declineFrinedRequest)
}

module.exports = userRoutes
