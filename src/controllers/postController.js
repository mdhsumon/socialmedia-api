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
        // New post data
        let newPost = {
            visibility: fields.visibility,
            userInfo: {
                userId: loggedUser.userId,
                username: loggedUser.username
            },
            content: {
                message: fields.message
            }
        }
        if(files.photos) {
            FC.uploadFiles(files.photos, loggedUser.username, filePaths => {
                let pathList = [], fileCoount = filePaths.length
                for(let i = 0; i < fileCoount; i++) {
                    pathList.push({ path: filePaths[i] })
                }
                newPost.content.attachment = { photos: pathList }
            })
        }
        else if(files.videos) {
            FC.uploadFiles(files.videos, loggedUser.username, filePaths => {
                let pathList = [], fileCoount = filePaths.length
                for(let i = 0; i < fileCoount; i++) {
                    pathList.push({ path: filePaths[i] })
                }
                newPost.content.attachment = { videos: pathList }
            })
        }
        PM.create(newPost, (createError, savedPost) => {
            if (createError) {
                res.json({
                    createStatus: false,
                    message: "Post not created"
                })
            }
            else {
                // Push profile info into created psot
                UM.findOne({ _id: loggedUser.userId }, "displayName profilePhoto", (err, info) => {
                    if (err) {
                        res.json({
                            createStatus: false,
                            message: "Profile into pushing failed"
                        })
                    }
                    else {
                        let newClone = CA.cloneObject(savedPost)
                        newClone.userInfo.displayName = info.displayName
                        newClone.userInfo.profilePhoto = info.profilePhoto
                        res.json({ status: true, createdPost: newClone})
                    }
                })
            }
        })
    })
}

// Get user posts
const getUserPosts = (req, res) => {
    PM.find(CA.validateId(req.params.userOrId) ? { "userInfo.userId": req.params.userOrId } : { "userInfo.username": req.params.userOrId })
    .sort({ createdAt: "desc" })
    .exec((err, posts) => {
        if (err) throw err
        else {
            posts.length ? res.json({ status: true, posts }) : res.json({ status: false, message: "No post found" })
        }
    })
}

// Get user feeds
const getUserFeeds = (req, res) => {
    // Find user friends
    UM.findOne(CA.userOrId(req), 'friends', (err, currentUser) => {
        if (err) throw err
        else {
            if(currentUser) {
                let friendIds = []
                activeFrineds = currentUser.friends.filter(friend => friend.status == 'active')
                for (let key in activeFrineds) {
                    friendIds[key] = activeFrineds[key].friendId
                }
                // Pushed logged user
                friendIds.push(`${currentUser._id}`)
                // Get friends public post
                PM.find({
                    "userInfo.userId": { $in: friendIds },
                    visibility: "public"
                })
                .sort({ createdAt: "desc" })
                .exec((er, posts) => {
                    if (er) throw er
                    else {
                        UM.find({ _id: { $in: friendIds } }, "displayName profilePhoto", (err, userData) => {
                            if (err) throw err
                            else {
                                let feeds = CA.cloneObject(posts)
                                feeds.map(post => {
                                    const info = userData.filter(data => data._id == post.userInfo.userId)[0]
                                    if (info) {
                                        post.userInfo.displayName = info.displayName
                                        post.userInfo.profilePhoto = info.profilePhoto
    
                                        // Push user data into comments
                                        // if(post.comments.length) {
                                        //     const commenters = post.comments.map(comment => comment.userId)
                                        //     UM.find({_id: { $in: commenters }}, "username displayName profilePhoto", (error, commentersInfo) => {
                                        //         if(error) throw error
                                        //         else {
                                        //             post.comments.map(com => {
                                        //                 const commenterData = commentersInfo.filter(item => item._id == com.userId)[0]
                                        //                 com.username = commenterData.username
                                        //                 com.displayName = commenterData.displayName
                                        //                 com.profilePhoto = commenterData.profilePhoto
                                        //             })
                                        //         }
                                        //     })
                                        // }
                                    }
                                })
                                res.json({ status: true, posts: feeds })
                            }
                        })
                    }
                })
            }
            else {
                res.json({ status: false, message: "No feed found" })
            }
        }
    })
}

// Get post by id
const getPostById = (req, res) => {
    PM.findById(req.params.postId, (err, post) => {
        if (err) throw err
        else post ? res.json({ status: true, post }) : res.json({ status: false, message: "No post found, Please check your post id" })
    })
}

// Update post by id
const updatePostById = (req, res) => {
    const loggedUser = CA.getLoggedUser(req)
    const postId = req.params.postId
    const area = req.body.area
    const action = req.body.action
    const data = req.body.data

    // Manage react/comment
    const manageAction = area => {
        PM.findOne({ _id: postId }, "userInfo", (err, post) => {
            if (err) throw err
            else {
                // Check friend or not
                UM.findOne({ _id: loggedUser.userId }, "friends username displayName profilePhoto", (err, userData) => {
                    if (err) throw err
                    else {
                        // Push logged user
                        userData.friends.push({ friendId: loggedUser.userId, status: 'active' })
                        const isFriend = userData.friends.filter(item => item.friendId === post.userInfo.userId)
                        if (isFriend.length) {
                            switch (area) {
                                case 'react':
                                    PM.findOne({_id: postId}, "reactions", (error, currentReactions) => {
                                        if(error) throw error
                                        else {
                                            if(react === 'like') {
                                                PM.updateOne({_id: postId}, { "reactions.likes": 'a' })
                                            }
                                            else if(react === 'dislike') {
                                                PM.updateOne({_id: postId}, { "reactions.dislikes": 'a' })
                                            }
                                        }
                                    })
                                break
                                case 'comment':
                                    switch (action) {
                                        case "add":
                                            PM.updateOne(
                                            { _id: postId },
                                            { $push: { comments: { userId: userData._id, message: data } } },
                                            error => {
                                                if (error) throw error
                                                else {
                                                    res.json({ status: true, message: "Comment added successfully!" })
                                                }
                                            })
                                        break

                                        case "edit":
                                            PM.updateOne(
                                            { _id: postId, "comments._id": req.body.commentId },
                                            { $set: { "comments.$.message": data } },
                                            error => {
                                                if (error) throw error
                                                else {
                                                    res.json({ status: true, message: "Comment updated successfully!" })
                                                }
                                            })
                                        break
                                    }
                                break
                                default:
                                    res.json({ status: false, message: "Invalid area data" })
                            }
                        }
                        else {
                            res.json({ status: false, message: "You are not friend or allowed to comment" })
                        }
                    }
                })
            }
        })
    }

    if (area && action && data) {
        if (area === 'react') {
            manageAction('react')
        }
        else if (area === 'comment') {
            manageAction('comment')
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
    PM.deleteOne({ _id: req.params.postId }, err => {
        if (err) {
            res.json({ status: false, message: "You are not allowed or invalid post id" })
        }
        else {
            res.json({ status: true, message: "Post has been deleted" })
        }
    })
}

module.exports = {
    createPost,
    getUserPosts,
    getUserFeeds,
    getPostById,
    updatePostById,
    deletePostById
}