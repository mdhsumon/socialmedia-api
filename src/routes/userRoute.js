const UC = require("../controllers/userController")
const MW = require("../middlewares/middlewares")
const userRoutes = app => {

    // Create new user. sample request body:
    // {"displayName": "Display Name", "gender": "male/female", "username": "unique username", "userEmail": "unique email", "userPass": "password"}
    app.post("/register", UC.createUser)

    // User login and return access token
    app.post("/login", MW.userLogin)

    // User logout
    app.get("/logout", MW.userLogout)

    // Check username or email exist or not
    app.get("/check/:type/:userOrEmail", UC.isUserExist)

    // Get single/multiple user basic info by id or username. like /id1,id2,username1... if multiple
    app.get("/user/summary/:userOrId", MW.checkUserToken, UC.getUserSummary)

    // User operation by username or user id
    app.route("/user/:userOrId")

    // Get user full informatin
    .get(MW.checkUserToken, UC.getUser)

    // Update user information. Request form sample data...
    .put(MW.checkUserToken, UC.updateUser)

    // Delete user
    .delete(MW.checkUserToken, UC.deleteUser)

    // Get random friend suggestion
    app.get("/friend/suggestion", MW.checkUserToken, UC.getFriendSuggestions)

    // Get friend list
    app.get("/friends/:userOrId", MW.checkUserToken, UC.getFriendLists)

    // Get friend request list
    app.get("/requests/:userOrId", MW.checkUserToken, UC.getFrinedRequests)

    // Get sent request list
    app.get("/sents/:userOrId", MW.checkUserToken, UC.getSentRequests)

    // Send friend request by username or id.
    app.put("/request/send/:toUserId", MW.checkUserToken, UC.sendFrinedRequest)

    // Accept friend request.
    app.put("/request/accept/:senderId", MW.checkUserToken, UC.acceptFrinedRequest)

    // Decline friend request.
    app.put("/request/decline/:toUserId", MW.checkUserToken, UC.declineFrinedRequest)

    // Decline friend request.
    app.put("/request/cancel/:toUserId", MW.checkUserToken, UC.cancelFrinedRequest)
}

module.exports = userRoutes
