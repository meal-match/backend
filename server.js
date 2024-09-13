const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

const app = express()
app.use(express.json())
dotenv.config()

// Connect to MongoDB
const dbUsername = process.env.DB_USERNAME
const dbPassword = process.env.DB_PASSWORD
const clusterUrl = process.env.DB_CLUSTER_URL

if (!dbUsername || !dbPassword || !clusterUrl) {
    throw new Error('Missing MongoDB connection environment variables')
}

const mongoUrl = `mongodb+srv://${dbUsername}:${dbPassword}@${clusterUrl}?retryWrites=true&w=majority`

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

// Root route (API spec?)
app.get('/', (req, res) => {
    res.send(
        'Hey congrats you connected to my API. I might give you a spec one day. Time will tell.'
    )
})

// Include route files
const authRoutes = require('./routes/authRoutes')

// Use routes
app.use('/auth', authRoutes)

// Catch-all route for undefined endpoints
app.use((req, res) => {
    res.status(404).send('Route not found')
})

// Set port to environment variable or 3000 as default
const port = process.env.PORT || 3000

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
