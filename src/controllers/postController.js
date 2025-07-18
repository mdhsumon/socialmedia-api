const UM = require("../models/userModel")
const PM = require("../models/postModel")
const CA = require("../common/commonActions")
const FC = require("../controllers/fileController")
const formidable = require("formidable")

// Create new post
const createPost = (req, res) => {
    const loggedUser = CA.getLoggedUser(req)
    const form = new formidable.IncomingForm({multiples: true})
    form.parse(req, (error, fields, files) => {
        let photosList = [], videosList = [], failedList = []
        let newPost = {
            visibility: ["public", "friends", "private"].indexOf(fields.visibility) > - 1 ? fields.visibility : "public",
            userInfo: {
                userId: loggedUser.userId,
                username: loggedUser.username
            },
            content: {
                message: fields.message,
                attachment: {
                    photos: [],
                    videos: []
                }
            }
        }
        if(files.photos) {
            FC.uploadFiles(files.photos, loggedUser.username, callback => {
                callback.uploaded.map(item => {
                    photosList.push({ path: "/file/" + item })
                })
                callback.failed && callback.failed.map(item => {
                    failedList.push(item)
                })
                newPost.content.attachment.photos = photosList
            })
        }
        if(files.videos) {
            FC.uploadFiles(files.videos, loggedUser.username, callback => {
                callback.uploaded.map(item => {
                    videosList.push({ path: "/file/" + item })
                })
                callback.failed && callback.failed.map(item => {
                    failedList.push(item)
                })
                newPost.content.attachment.videos = videosList
            })
        }
        if(fields.message || photosList.length || videosList.length) {
            UM.findOne({ _id: loggedUser.userId }, "displayName profilePhoto coverPhoto", (err, info) => {
                if(err) {
                    res.json({status: false, message: "No user found to create post"})
                }
                else {
                    PM.create(newPost, (err, savedPost) => {
                        if(err) {
                            res.json({status: false, message: "Post not created"})
                        }
                        else {
                            failedList.length ?
                            res.json({status: true, createdPost: savedPost, failed: `File(s) not allowed: ${failedList}`}) :
                            res.json({status: true, createdPost: savedPost})
                        }
                    })
                }
            })
        }
        else res.json({status: false, message: "Empty post content"})
    })
}

// Get user posts
const getUserPosts = (req, res) => {
    const postCount = 10
    const loggedUserId = CA.getLoggedUser(req).userId
    const otherUser = req.params.userOrId

    const fetchPosts = query => {
        PM.find(query)
        .limit(postCount)
        .sort({ createdAt: "desc" })
        .exec((err, posts) => {
            if (err) res.json({ status: false, message: "Something went wrong" })
            else {
                if(posts.length) {
                    // Pushing commenters summary
                    const postData = CA.cloneObject(posts)
                    const comsReps = []
                    postData.map(post => {
                        if(post.comments.length) {
                            post.comments.map(comment => {
                                comsReps.push(comment.userId)
                                if(comment.replies.length)
                                comment.replies.map(reply => comsReps.push(reply.userId))
                            })
                        }
                    })
                    if(comsReps.length) {
                        UM.find(
                            {_id: {$in: comsReps}},
                            "username displayName profilePhoto coverPhoto",
                            (err, users) => {
                                if(!err && users.length) {
                                    postData.map(post => {
                                        if(post.comments.length) {
                                            post.comments.map(comment => {
                                                const userInfo = users.filter(user => user._id == comment.userId)[0]
                                                comment.username = userInfo.username
                                                comment.displayName = userInfo.displayName
                                                comment.profilePhoto = userInfo.profilePhoto
                                                comment.coverPhoto = userInfo.coverPhoto
                                                if(comment.replies.length) {
                                                    comment.replies.map(reply => {
                                                        const userInfo = users.filter(user => user._id == reply.userId)[0]
                                                        reply.username = userInfo.username
                                                        reply.displayName = userInfo.displayName
                                                        reply.profilePhoto = userInfo.profilePhoto
                                                        reply.coverPhoto = userInfo.coverPhoto
                                                    })
                                                }
                                            })
                                        }
                                    })
                                    res.json({status: true, posts: postData})
                                }
                            }
                        )
                    }
                    else res.json({status: true, posts})
                }
                else res.json({status: false, message: "No post found"})
            }
        })
    }

    if(Object.keys(req.params).length) {
        const userOrId = CA.userOrId(otherUser)
        UM.findOne(userOrId, "friends", (err, user) => {
            if(!err && user) {
                const isFriend = user.friends.filter(fr => fr.friendId === loggedUserId)
                let query = CA.validateId(otherUser) ? {"userInfo.userId": otherUser} : {"userInfo.username": otherUser}
                const orCond = isFriend ? [{visibility: "friends"}, {visibility: "public"}] : [{visibility: "public"}]
                query.$or = orCond
                fetchPosts(query)
            }
            else {
                res.json({ status: false, message: "Invalid user" })
            }
        })
    }
    else {
        fetchPosts({"userInfo.userId": loggedUserId})
    }
}

// Get user feeds
const getUserFeeds = (req, res) => {
    // Find user friends
    const feedsCount = 10
    const loggedUserId = CA.getLoggedUser(req).userId
    UM.findOne({ _id: loggedUserId }, "friends", (err, currentUser) => {
        if (err) res.json({ status: false, message: "Something went wrong on user friends" })
        else {
            // Filter active user posts
            let activeFriends = currentUser.friends.filter(friend => friend.status === "active").map(user => user.userId)
            // Pushed logged user in friend list
            activeFriends.push(`${loggedUserId}`)
            PM.find({
                "userInfo.userId": { $in: activeFriends },
                $or: [{visibility: "public"}, {visibility: "friends"}]
            })
            .limit(feedsCount)
            .sort({ createdAt: "desc" })
            .exec((er, posts) => {
                if(er) res.json({ status: false, message: "Something went wrong on post result" })
                else {
                    if(posts.length) {
                        // Pushing commenters summary
                        const postData = CA.cloneObject(posts)
                        const comsReps = []
                        postData.map(post => {
                            if(post.comments.length) {
                                post.comments.map(comment => {
                                    comsReps.push(comment.userId)
                                    if(comment.replies.length)
                                    comment.replies.map(reply => comsReps.push(reply.userId))
                                })
                            }
                        })
                        if(comsReps.length) {
                            UM.find(
                                {_id: {$in: comsReps}},
                                "username displayName profilePhoto coverPhoto",
                                (err, users) => {
                                    if(er) res.json({ status: false, message: "Error on comments or replies" })
                                    else {
                                        postData.map(post => {
                                            if(post.comments.length) {
                                                post.comments.map(comment => {
                                                    const userInfo = users.filter(user => user._id == comment.userId)[0]
                                                    comment.username = userInfo.username
                                                    comment.displayName = userInfo.displayName
                                                    comment.profilePhoto = userInfo.profilePhoto
                                                    comment.coverPhoto = userInfo.coverPhoto
                                                    if(comment.replies.length) {
                                                        comment.replies.map(reply => {
                                                            const userInfo = users.filter(user => user._id == reply.userId)[0]
                                                            reply.username = userInfo.username
                                                            reply.displayName = userInfo.displayName
                                                            reply.profilePhoto = userInfo.profilePhoto
                                                            reply.coverPhoto = userInfo.coverPhoto
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                        res.json({status: true, posts: postData})
                                    }
                                }
                            )
                        }
                        else res.json({status: true, posts})
                    }
                    else {
                        res.json({ status: false, message: "No feed found" })
                    }
                }
            })
        }
    })
}

// Get post by id
const getPostById = (req, res) => {
    PM.findById(req.params.postId, (err, post) => {
        if (err) res.json({ status: false, message: "Something went wrong" })
        else post ? res.json({ status: true, post }) : res.json({ status: false, message: "No post found, Please check your post id" })
    })
}

// Update post by id
const updatePostById = (req, res) => {
    const loggedUser = CA.getLoggedUser(req).userId
    const emojis = ["128150", "128525", "128516", "128578", "128545"]
    const postId = req.params.postId
    const area = req.body.area
    const action = req.body.action
    const data = req.body.data
    // Manage react/comment
    const manageAction = area => {
        const manageReact = post => {
            const findUser = [...post.reactions.likes, ...post.reactions.emojis].filter(item => item.userId === loggedUser)[0]
            let column = data === "like" ? "reactions.likes" : "reactions.emojis"
            let newDoc, counter, condition = {_id: postId}, dataObj = {}
            dataObj[column] = {userId: loggedUser, data: data}
            if(findUser && findUser.data !== data) {
                // Emoji swaping
                if(data !== "like" && emojis.filter(emo => emo === findUser.data).length) {
                    condition["reactions.emojis.userId"] = loggedUser
                    newDoc = {
                        $set: {"reactions.emojis.$.data": data}
                    }
                }
                else {
                    let pullData = {}
                    column = data !== "like" ? "reactions.likes" : "reactions.emojis"
                    pullData[column] = {userId: loggedUser, data: findUser.data}
                    counter = post.reactions.count
                    newDoc = {
                        $pull: pullData,
                        $addToSet: dataObj,
                    }
                }
            }
            else if(findUser) {
                counter = post.reactions.count > 0 ? post.reactions.count - 1 : post.reactions.count
                newDoc = {
                    "reactions.count": counter,
                    $pull: dataObj
                }
            }
            else {
                counter = post.reactions.count + 1
                newDoc = {
                    "reactions.count": counter,
                    $addToSet: dataObj
                }
            }
            PM.updateOne(condition, newDoc, (err, raw) => {
                    if(err || !raw.nModified) res.json({ status: false, message: "Updating error" })
                    else res.json({ status: true, count: counter, message: `You have ${counter ? "reacted" : "pulled reaction"}` })
                }
            )
        }
        PM.findOne({ _id: postId }, "userInfo reactions", (err, post) => {
            if(err) res.json({ status: false, message: "Post not found" })
            else {
                // Check friend or not
                UM.findOne({ _id: loggedUser }, "friends", (err, userData) => {
                    if(err) res.json({ status: false, message: "Something went wrong" })
                    else {
                        // Pushed logged user for reacting own post
                        userData.friends.push({status: "active", userId: loggedUser})
                        const isFriend = userData.friends.filter(user => user.userId === post.userInfo.userId)
                        if(isFriend.length) {
                            switch (area) {
                                case "react":
                                    if(data === "like" || emojis.filter(emo => emo === data).length) {
                                        manageReact(post)
                                    }
                                    else {
                                        res.json({ status: false, message: "Invalid reaction requested" })
                                    }
                                break
                                case "comment":
                                    switch(action) {
                                        case "add":
                                            PM.updateOne(
                                            { _id: postId },
                                            { $push: { comments: { userId: loggedUser, message: data } } },
                                            error => {
                                                if(error) res.json({ status: false, message: "Something went wrong" })
                                                else {
                                                    res.json({ status: true, message: "Comment added" })
                                                }
                                            })
                                        break

                                        case "edit":
                                            PM.updateOne(
                                            { _id: postId, "comments._id": req.body.commentId },
                                            { $set: { "comments.$.message": data } },
                                            error => {
                                                if(error) res.json({ status: false, message: "Error or invalid comment id" })
                                                else {
                                                    res.json({ status: true, message: "Comment updated" })
                                                }
                                            })
                                        break
                                        case "addreply":
                                            PM.updateOne(
                                            { _id: postId, "comments._id": req.body.commentId },
                                            { $push: { "comments.$.replies": { userId: loggedUser, message: data } } },
                                            error => {
                                                if(error) res.json({ status: false, message: "Error or invalid comment id" })
                                                else res.json({ status: true, message: "Comment reply added" })
                                            })
                                        break
                                        case "editreply":
                                            PM.updateOne(
                                            { _id: postId, "comments.replies._id": req.body.replyId },
                                            { $set: { "comments.replies.$.message": data } },
                                            error => {
                                                if(error) res.json({ status: false, message: "Error or invalid comment id" })
                                                else res.json({ status: true, message: "Comment reply updated" })
                                            })
                                        break
                                        default: res.json({ status: false, message: "Invalid action data" })
                                    }
                                break
                                default: res.json({ status: false, message: "Invalid area data" })
                            }
                        }
                        else {
                            res.json({ status: false, message: "You are not friend" })
                        }
                    }
                })
            }
        })
    }

    if (area && action || data) {
        if (area === "react") {
            manageAction("react")
        }
        else if (area === "comment") {
            manageAction("comment")
        }
        else {
            res.json({ status: false, message: "Invalid area data" })
        }
    }
    else {
        res.json({ status: false, message: "Invalid requst body data" })
    }
}

// Delete post by id
const deletePostById = (req, res) => {
    const loggedUserId = CA.getLoggedUser(req).userId
    PM.deleteOne(
        {$and: [{ _id: req.params.postId }, { "userInfo.userId": loggedUserId }]},
        (err, stat) => {
            if (err) {
                res.json({ status: false, message: "Something went wrong" })
            }
            else {
                if(stat.deletedCount) {
                    res.json({ status: true, message: "Post has been deleted" })
                }
                else {
                    res.json({ status: false, message: "You are not allowed or invalid post id" })
                }
            }
        }
    )
}

module.exports = {
    createPost,
    getUserPosts,
    getUserFeeds,
    getPostById,
    updatePostById,
    deletePostById
} 