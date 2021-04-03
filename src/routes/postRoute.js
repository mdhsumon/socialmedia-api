const PC = require("../controllers/postController")
const MW = require("../middlewares/middlewares")

const postRoutes = app => {

    // Create post. Request data must be sent by form. Post message and visibility are requred.
    app.post("/post", MW.checkUserToken, PC.createPost)

    // Get logged user all post
    app.get("/posts", MW.checkUserToken, PC.getUserPosts)

    // Get user public/friends posts
    app.get("/posts/:userOrId", MW.checkUserToken, PC.getUserPosts)

    app.route("/post/:postId")
    
        // Get sigle post
        .get(MW.checkUserToken, PC.getPostById)

        // Update post. Sample body for react {"area": "react", "data": "like/emoji(code)"}
        // Update post. Sample body for comment {"area": "comment", "action": "add/edit", "data": "Comment message..."} if edit { commentId: ""}
        .put(MW.checkUserToken, PC.updatePostById)

        // Delete single post
        .delete(MW.checkUserToken, PC.deletePostById)

    // Get logged user feeds
    app.get("/feeds", MW.checkUserToken, PC.getUserFeeds)
}

module.exports = postRoutes
