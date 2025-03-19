const dotenv = require('dotenv')
const mongoose = require('mongoose')
const fetch = require('node-fetch')

dotenv.config()

const mongooseClient = {}

const buildInterval = (routeName) => {
    const requestUrl = `http://localhost:${process.env.PORT}/intervals/${routeName}`

    return async () => {
        try {
            await fetch(requestUrl, {
                method: 'POST',
                body: JSON.stringify({
                    token: process.env.INTERVAL_CLIENT_TOKEN
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
        } catch (e) {
            console.log(`Error in interval ${routeName}:`, e)
        }
    }
}

mongooseClient.connect = async (mongoUrl) => {
    try {
        await mongoose.connect(mongoUrl)
        console.log('Connected to MongoDB')

        if (process.env.LOCAL === 'true') {
            // Build local-dev versions of the interval clients
            console.log('Building local interval clients')

            // Check for completed orders every 5 minutes
            setInterval(buildInterval('complete-orders'), 5 * 60 * 1000)

            // Check for unclaimed orders every minute
            setInterval(buildInterval('delete-unclaimed-orders'), 60 * 1000)

            // Check for order ready notifications every minute
            setInterval(buildInterval('send-ready-notifications'), 60 * 1000)

            // Check for seller timeouts every ten seconds
            setInterval(buildInterval('seller-timeout'), 10 * 1000)

            // Check for queued notifications every ten seconds
            setInterval(buildInterval('send-notifications'), 10 * 1000)
        }
    } catch (err) {
        console.log('Error connecting to MongoDB', err)
        throw err
    }
}

module.exports = mongooseClient
