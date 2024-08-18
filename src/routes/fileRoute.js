const FC = require("../controllers/fileController")
const MW = require("../middlewares/middlewares")

const fileRoutes = app => {
    // Get global files
    app.get("/file/default/:fileName", FC.getDefaultFile)

    // Get user files
    app.get("/file/:fileName", FC.getUserFile)
}

module.exports = fileRoutes