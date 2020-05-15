const root = require('../../index')
const fs = require("fs")
const mv = require("mv")
const CA = require("../common/commonActions")

// Create folder to any directory
const createFolder = path => {
    path = root.rootPath + path
    fs.mkdir(path, {recursive: true, mode: 7777}, (err, status) => {
        status(err ? false : true)
    })
}

// Upload files and return file paths
const uploadFiles = (fileObjects, username, callback) => {
    let filePaths = []

    // File name formating. Sample: username-timestamp-filename.extension
    const formatFileName = name => {
        const modifiedName = name.replace(/\s+|-+|#+/g, '_').toLowerCase()
        return /*username + '-' + */ Date.now().toString() + '-' + modifiedName
    }

    // Move file into respective directory
    const moveFile = file => {
        const fileName = formatFileName(file.name)
        const oldPath = file.path
        const fileType = file.type.split('/')
        const newPath = root.rootPath + '/src/resources/user/' + fileType[0] + 's/' + fileName
        mv(oldPath, newPath, err => {
            if(err) return callback([])
        })
        filePaths.push('/' + fileType[0] + '/' + fileName)
    }

    if(fileObjects.length > 1) {
        fileObjects.map(file => {
            moveFile(file)
        })
    }
    else {
        moveFile(fileObjects)
    }

    callback(filePaths)
}

// Global file serving
const getDefaultFile = (req, res) => {
    const filePath = `./src/resources/default/${req.params.fileType}s/${req.params.fileName}`
    res.sendFile(filePath, { root: root.rootPath }, err => {
        if(err) res.json("Invalid url")
    })
}

// User file serving
const getUserFile = (req, res) => {
    const filePath = `./src/resources/user/${req.params.fileType}s/${req.params.fileName}`
    res.sendFile(filePath, { root: root.rootPath }, err => {
        if(err) res.json("Invalid url")
    })
}

module.exports = {
    createFolder,
    uploadFiles,
    getDefaultFile,
    getUserFile
}
