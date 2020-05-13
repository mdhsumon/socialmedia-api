const root = require('../../index')
const fs = require("fs")
const mv = require("mv")

// Create folder to any directory
const createFolder = path => {
    path = root.rootPath + path
    fs.mkdir(path, {recursive: true, mode: 0o777}, callback => {
    })
}

// Create folders for new user
const createNewUserFolder = username => {
    path = root.rootPath + '/src/resources/users/' + username
    fs.mkdir(path, err => {

        fs.mkdir(path + '/files', err => {
            err ? createStatus = false : createStatus = true
        })
        fs.mkdir(path + '/images', err => {
            err ? createStatus = false : createStatus = true
        })
        fs.mkdir(path + '/videos', err => {
            err ? createStatus = false : createStatus = true
        })
    })
}

// Upload files and return file paths
const uploadFiles = (fileObjects, username, callback) => {
    let filePaths = []
    const fileCount = fileObjects.length
    if(fileCount > 1) {
        for(let i = 0; i < fileCount; i++) {
            const fileName = fileObjects[i].name.toLowerCase()// + '-' + Date.now()
            const oldPath = fileObjects[i].path
            const fileType = fileObjects[i].type.split('/')
            const newPath = root.rootPath + '/src/resources/users/' + username + '/' + fileType[0] + 's/' + fileName
            filePaths[i] = '/file/' + username + '/' + fileType[0] + '/' + fileName
            mv(oldPath, newPath, err => {
                if(err) return callback(false)
            })
        }
    }
    else {
        const fileName = fileObjects.name.toLowerCase()// + '-' + Date.now()
        const oldPath = fileObjects.path
        const fileType = fileObjects.type.split('/')
        const newPath = root.rootPath + '/src/resources/users/' + username + '/' + fileType[0] + 's/' + fileName
        filePaths[0] = '/file/' + username + '/' + fileType[0] + '/' + fileName
        mv(oldPath, newPath, err => {
            if(err) callback(false)
        })
    }
    callback(filePaths)
}

// Global file serving
const getGlobalFile = (req, res) => {
    const filePath = `./src/resources/global/${req.params.fileType}s/${req.params.fileName}`
    return res.sendFile(filePath, { root: root.rootPath })
}

// User file serving
const getUserFile = (req, res) => {
    const filePath = `./src/resources/users/${req.params.username}/${req.params.fileType}s/${req.params.fileName}`
    return res.sendFile(filePath, { root: root.rootPath })
}

module.exports = {
    createFolder,
    createNewUserFolder,
    uploadFiles,
    getGlobalFile,
    getUserFile
}
