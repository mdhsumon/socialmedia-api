const root = require("../../index")
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
    const filePaths = []
    const failedList = []

    // Verify file extension
    const verifyFile = extension => {
        const filesAllowed = ["jpg", "jpeg", "png", "3gp", "mp4", "avi", "mkv", "mov", "pdf", "doc", "xls", "ppt"]
        return filesAllowed.filter(ex => ex === extension.toLowerCase()).length ? true : false
    }

    // File name formating. Sample: username-timestamp-filename.extension
    const formatFileName = name => {
        const modifiedName = name.replace(/\s+|_+|#+/g, '-').toLowerCase()
        return /*username + '-' + */ Date.now().toString() + '-' + modifiedName
    }

    // Move file into respective directory
    const moveFile = file => {
        const fileName = formatFileName(file.name)
        const oldPath = file.path
        const fileType = file.type.split('/')
        const newPath = root.rootPath + "/src/resources/user/" + fileType[0] + "s/" + fileName
        if(verifyFile(fileType[1])) {
            mv(oldPath, newPath, err => err ? false: true)
            filePaths.push(fileName)
        }
        else {
            failedList.push(file.name)
        }
    }

    if(fileObjects.length > 1) {
        fileObjects.map(file => {
            moveFile(file)
        })
    }
    else {
        moveFile(fileObjects)
    }
    failedList.length ? callback({uploaded: filePaths, failed: failedList}) : callback({uploaded: filePaths})
}

// Global file serving
const getDefaultFile = (req, res) => {
    const fType = fileType(req.params.fileName)
    if(fType) {
        const filePath = `./src/resources/default/${fType}/${req.params.fileName}`
        res.sendFile(filePath, { root: root.rootPath }, err => {
            //if(err) res.json("File not found")
        })
    }
    else {
        res.json({status: false, message: "Unsupported file(s)"})
    }
}

// User file serving
const getUserFile = (req, res) => {
    const fType = fileType(req.params.fileName)
    if(fType) {
        const filePath = `./src/resources/user/${fType}/${req.params.fileName}`
        res.sendFile(filePath, { root: root.rootPath }, err => {
            //if(err) res.json("File not found")
        })
    }
    else {
        res.json({status: false, message: "Unsupported file"})
    }
}

// Verify file type and get folder name
const fileType = name => {
    const types = {
        images: ["jpg","jpeg","png"],
        audios: ["mp3"],
        videos: ["mp4","3gp","mov","avi","mkv"],
        files: ["pdf","doc","xls","ppt"]
    }
    const fName = name.split(".")
    const extension = fName[fName.length - 1]
    let type = null
    for(let key in types) {
        if(types[key].filter(t => t === extension.toLowerCase()).length) {
            type = key
            break
        }
    }
    return type ? type : false
}

module.exports = {
    createFolder,
    uploadFiles,
    getDefaultFile,
    getUserFile
}
