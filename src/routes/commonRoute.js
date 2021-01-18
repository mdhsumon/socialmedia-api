const CC = require("../controllers/commonController")
const MW = require("../middlewares/middlewares")

const commonRoutes = app => {
    // Table and column specific data operation
    app.route('/data/:table/:column/:rowId')

    // Get sigle column
    .get(MW.checkUserToken, CC.getTableColumn)

    // Update sigle column
    .put(MW.checkUserToken, CC.updateTableColumn)
}

module.exports = commonRoutes