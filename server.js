const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const MongoStore = require('connect-mongo')
const session = require('express-session')
const rateLimit = require('express-rate-limit')

const app = express()
app.use(express.json())
dotenv.config()

// Enable CORS
if (process.env.ENVIRONMENT === 'dev') {
    app.use(
        cors({
            origin: true, // Allow requests from any origin
            credentials: true // Allow cookies to be sent
        })
    )
} else {
    app.use(
        cors({
            origin: process.env.CLIENT_URL, // Allow requests only from client URL
            credentials: true // Allow cookies to be sent
        })
    )
}

// Connect to MongoDB
const mongooseClient = require('./services/mongooseClient')

const dbUsername = process.env.DB_USERNAME
const dbPassword = process.env.DB_PASSWORD
const dbName = process.env.DB_NAME
const clusterUrl = process.env.DB_CLUSTER_URL

if (!dbUsername || !dbPassword || !clusterUrl) {
    throw new Error('Missing MongoDB connection environment variables')
}

const mongoUrl = `mongodb+srv://${dbUsername}:${dbPassword}@${clusterUrl}/${dbName}?retryWrites=true&w=majority`
mongooseClient.connect(mongoUrl)

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

// Configure rate limiting
app.use(
    rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false // Disable the `X-RateLimit-*` headers
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
const orderRoutes = require('./routes/orderRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const payoutRoutes = require('./routes/payoutRoutes')
const profileRoutes = require('./routes/profileRoutes')
const pushTokenRoutes = require('./routes/pushTokenRoutes')
const restaurantRoutes = require('./routes/restaurantRoutes')

// Use routes
app.use('/auth', authRoutes)
app.use('/orders', orderRoutes)
app.use('/payment', paymentRoutes)
app.use('/payout', payoutRoutes)
app.use('/profile', profileRoutes)
app.use('/push-token', pushTokenRoutes)
app.use('/restaurants', restaurantRoutes)

// Catch-all route for undefined endpoints
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found'
    })
})

// Set port to environment variable or 3000 as default
const port = process.env.PORT || 3000

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
