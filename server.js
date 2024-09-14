const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const MongoStore = require('connect-mongo')
const mongoose = require('mongoose')
const session = require('express-session')

const app = express()
app.use(express.json())
dotenv.config()
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:8081',
        credentials: true // allow cookies to be sent
    })
)

// Connect to MongoDB
const dbUsername = process.env.DB_USERNAME
const dbPassword = process.env.DB_PASSWORD
const dbName = process.env.DB_NAME
const clusterUrl = process.env.DB_CLUSTER_URL

if (!dbUsername || !dbPassword || !clusterUrl) {
    throw new Error('Missing MongoDB connection environment variables')
}

const mongoUrl = `mongodb+srv://${dbUsername}:${dbPassword}@${clusterUrl}/${dbName}?retryWrites=true&w=majority`

mongoose
    .connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('Connected to MongoDB')
    })
    .catch((err) => {
        console.log('Error connecting to MongoDB', err)
    })

// Configure session management
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'yourSecretKey', // Set a strong secret for session encryption
        resave: false, // Don't save session if unmodified
        saveUninitialized: false, // Don't create session until something is stored
        store: MongoStore.create({
            mongoUrl: mongoUrl, // Store session in MongoDB
            collectionName: 'sessions' // The name of the collection for sessions
        }),
        cookie: {
            secure: process.env.ENVIRONMENT === 'prod', // Use secure cookies in production
            maxAge: 1000 * 60 * 60 * 24 // Session expires in 1 day
        }
    })
)

// Root route (API spec?)
app.get('/', (req, res) => {
    res.send(
        'Hey congrats you connected to my API. I might give you a spec one day. Time will tell.'
    )
})

// Include route files
const authRoutes = require('./routes/authRoutes')
const profileRoutes = require('./routes/profileRoutes')

// Use routes
app.use('/auth', authRoutes)
app.use('/profile', profileRoutes)

// Catch-all route for undefined endpoints
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: 'Not found'
    })
})

// Set port to environment variable or 3000 as default
const port = process.env.PORT || 3000

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
