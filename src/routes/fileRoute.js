const FC = require('../controllers/fileController')
const MW = require('../middlewares/middlewares')

const fileRoutes = app => {
    // Get global files. FileType should be file/image/pdf
    app.get('/file/default/:fileType/:fileName', MW.checkUserToken, FC.getDefaultFile)

    // Get user files. FileType should be image/video/audio/file
    app.get('/file/:fileType/:fileName', MW.checkUserToken, FC.getUserFile)
}

module.exports = fileRoutes