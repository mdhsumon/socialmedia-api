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
        let photosList = []
        let videosList = []
        let failedList = []
        // New post data
        let newPost = {
            visibility: fields.visibility,
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
                    photosList.push({ path: item })
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
                    videosList.push({ path: item })
                })
                callback.failed && callback.failed.map(item => {
                    failedList.push(item)
                })
                newPost.content.attachment.videos = videosList
            })
        }
        if(fields.message.length || photosList.length || videosList.length) {
            UM.findOne({ _id: loggedUser.userId }, "displayName profilePhoto", (err, info) => {
                if(err) {
                    res.json({status: false, message: "User not found to create post"})
                }
                else {
                    PM.create(newPost, (createError, savedPost) => {
                        if(createError) {
                            res.json({status: false, message: "Post not created"})
                        }
                        else {
                            // Push profile info into created psot
                            let clonedPost = CA.cloneObject(savedPost)
                            clonedPost.userInfo.displayName = info.displayName
                            clonedPost.userInfo.profilePhoto = info.profilePhoto
                            failedList.length ?
                            res.json({status: true, createdPost: clonedPost, failed: `File(s) not allowed: ${failedList}`}) :
                            res.json({status: true, createdPost: clonedPost})
                        }
                    })
                }
            })
        }
        else {
            res.json({status: false, message: "No post content provided"})
        }
    })
}

// Get user posts
const getUserPosts = (req, res) => {
    const query = CA.validateId(req.params.userOrId) ? { "userInfo.userId": req.params.userOrId } : { "userInfo.username": req.params.userOrId }
    PM.find(query)
    .sort({ createdAt: "desc" })
    .exec((err, posts) => {
        if (err) res.json({ status: false, message: "Something went wrong" })
        else {
            posts.length ? res.json({ status: true, posts }) : res.json({ status: false, message: "No post found" })
        }
    })
}

// Get user feeds
const getUserFeeds = (req, res) => {
    // Find user friends
    UM.findOne(CA.userOrId(req), 'friends', (err, currentUser) => {
        if (err) res.json({ status: false, message: "Something went wrong" })
        else {
            if(currentUser) {
                let friendIds = currentUser.friends.filter(friend => friend.status === 'active').map(user => user.friendId)
                // Pushed logged user
                friendIds.push(`${currentUser._id}`)
                // Get friends public post
                PM.find({
                    "userInfo.userId": { $in: friendIds },
                    "$or": [{visibility: "public"}, {visibility: "friends"}]
                })
                .sort({ createdAt: "desc" })
                .exec((er, posts) => {
                    if (er) throw er
                    else {
                        UM.find({ _id: { $in: friendIds } }, "displayName profilePhoto", (err, userData) => {
                            if (err) res.json({ status: false, message: "Something went wrong" })
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
                                        //         if(error) res.json({ status: false, message: "Something went wrong" })
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
        if (err) res.json({ status: false, message: "Something went wrong" })
        else post ? res.json({ status: true, post }) : res.json({ status: false, message: "No post found, Please check your post id" })
    })
}

// Update post by id
const updatePostById = (req, res) => {
    const loggedUser = CA.getLoggedUser(req).userId
    const emojis = ['128150', '128525', '128516', '128578', '128545']
    const postId = req.params.postId
    const area = req.body.area
    const action = req.body.action
    const data = req.body.data
    // Manage react/comment
    const manageAction = area => {
        const manageReact = post => {
            const findUser = [...post.reactions.likes, ...post.reactions.emojis].filter(item => item.userId === loggedUser)[0]
            let column = data === "like" ? "reactions.likes" : "reactions.emojis"
            let newDoc, counter, condition = {_id: postId} , dataObj = {}
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
            PM.updateOne(
                condition,
                newDoc,
                (err, raw) => {
                    if(!err)
                    res.json({ status: true, count: counter, message: `You have ${counter ? "reacted" : "pulled reaction"}` })
                }
            )
        }
        PM.findOne({ _id: postId }, "userInfo reactions", (err, post) => {
            if (err) res.json({ status: false, message: "Something went wrong" })
            else {
                // Check friend or not
                UM.findOne({ _id: loggedUser }, "friends status", (err, userData) => {
                    if (err) res.json({ status: false, message: "Something went wrong" })
                    else {
                        // Pushed logged user for reacting self post
                        userData.friends.push({status: 'active', friendId: loggedUser})
                        const isFriend = userData.friends.filter(user => user.friendId === post.userInfo.userId)
                        if (isFriend.length) {
                            switch (area) {
                                case 'react':
                                    if(data === 'like' || emojis.filter(emo => emo === data).length) {
                                        manageReact(post)
                                    }
                                    else {
                                        res.json({ status: false, message: "Invalid reaction requested" })
                                    }
                                break
                                case 'comment':
                                    switch (action) {
                                        case "add":
                                            PM.updateOne(
                                            { _id: postId },
                                            { $push: { comments: { userId: userData._id, message: data } } },
                                            error => {
                                                if (error) res.json({ status: false, message: "Something went wrong" })
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
                                                if (error) res.json({ status: false, message: "Something went wrong" })
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

    if (area && action || data) {
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