const PM = require("../models/postModel")
const UM = require("../models/userModel")

// Get column data
const getTableColumn = (req, res) => {
    const tableModel = req.params.table === 'user' ? UM : req.params.table === 'post' ? PM : ''
    tableModel.findOne({_id: req.params.rowId}, req.params.column, (err, columnData) => {
        if(err) res.json({ status: false, message: "Something went wrong" })
        res.json(columnData)
    })
}

// Get column data
const updateTableColumn = (req, res) => {
    const tableModel = req.params.table === 'user' ? UM : req.params.table === 'post' ? PM : ''
    tableModel.updateOne({_id: req.params.rowId}, req.body, err => {
        if(err) res.json({ status: false, message: "Something went wrong" })
        res.json({ status: true, message: `Column(${req.params.column}) is updated` })
    })
}

module.exports = {
    getTableColumn,
    updateTableColumn
}