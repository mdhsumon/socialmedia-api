const FC = require('../controllers/fileController')
//const MW = require('../middlewares/middlewares')

const fileRoutes = app => {

    // Get global files. FileType should be file/image/pdf
    app.get('/file/global/:fileType/:fileName', FC.getGlobalFile)

    // Get user files. FileType should be file/image/pdf
    app.get('/file/:username/:fileType/:fileName', FC.getUserFile)
}

module.exports = fileRoutes