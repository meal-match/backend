const dotenv = require('dotenv')
const express = require('express')
const intervalClient = require('../services/intervalClient')

const app = express()
dotenv.config()

const hasAuthorization = (req, res, next) => {
    const { token } = req.body
    if (token === process.env.INTERVAL_CLIENT_TOKEN) {
        next()
    } else {
        res.status(401).json({
            message: 'Unauthorized'
        })
    }
}

// Happens every 15 minutes
app.post('/fifteen-minutes', hasAuthorization, async (req, res) => {
    await intervalClient.completeOrders()
    res.status(200)
})

// Happens every minute
app.post('/one-minute', hasAuthorization, async (req, res) => {
    await intervalClient.deleteUnclaimedOrders()
    await intervalClient.sendReadyNotifications()
    await intervalClient.sellerTimeout()
    res.status(200)
})

module.exports = app
