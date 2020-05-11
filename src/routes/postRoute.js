const PC = require("../controllers/postController")
const MW = require("../middlewares/middlewares")

const postRoutes = app => {

    // Create post
    app.post('/post/create', MW.checkUserToken, PC.createPost)

    // Get only user posts
    app.get('/:userOrId/posts', MW.checkUserToken, PC.getUserPosts)

    // Get user feeds
    app.get('/:userOrId/feeds', MW.checkUserToken, PC.getUserFeeds)

    app.route('/post/:postId')
    
        // Get sigle post
        .get(MW.checkUserToken, PC.getPostById)

        // Update post. Sample body for react {"area": "react", "action": "like/dislike, "data": "like/dislike"}
        // Update post. Sample body for comment {"area": "comment", "action": "add/edit", "data": "Comment message..."} if edit { commentId: ""}
        .put(MW.checkUserToken, PC.updatePostById)

        // Delete single post
        .delete(MW.checkUserToken, PC.deletePostById)
}

module.exports = postRoutes
