const FC = require('../controllers/fileController')
//const MW = require('../middlewares/middlewares')

const fileRoutes = app => {
    // Get global files. FileType should be file/image/pdf
    app.get('/default/:fileType/:fileName', FC.getDefaultFile)

    // Get user files. FileType should be image/video/audio/file
    app.get('/:fileType/:fileName', FC.getUserFile)
}

module.exports = fileRoutes