require('dotenv/config')
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const commonRoutes = require('./src/routes/commonRoute')
const userRoutes = require('./src/routes/userRoute')
const chatRoutes = require('./src/routes/chatRoute')
const postRoutes = require('./src/routes/postRoute')
const fileRoutes = require('./src/routes/fileRoute')
const cors = require('cors')

const app = express()
const PORT = process.env.SERVER_PORT

// Database Connection
const db = mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true })

// Body Parsr
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// CORS
app.use(cors())

// All landing routes
app.get('/', (req, res) => {res.json({message: "Welcome to landing page"})})

// Passing app to routes
commonRoutes(app)
userRoutes(app)
chatRoutes(app)
postRoutes(app)
fileRoutes(app)

// Error routes
app.use((req, res) => { res.json("Invalid url or request") })

app.listen(PORT, () => { console.log(`Server running on port: ${PORT}`) })

// Export project root directory as root path
exports.rootPath = __dirname
