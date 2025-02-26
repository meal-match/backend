const mongoose = require('mongoose')
const intervals = require('./intervalClient')

const mongooseClient = {}

mongooseClient.connect = async (mongoUrl) => {
    try {
        await mongoose.connect(mongoUrl)
        console.log('Connected to MongoDB')

        // Check for unclaimed orders every minute
        setInterval(intervals.deleteUnclaimedOrders, 60 * 1000)

        // Check for seller timeouts every ten seconds
        setInterval(intervals.sellerTimeout, 10 * 1000)

        // Check for order ready notifications every minute
        setInterval(intervals.sendReadyNotifications, 60 * 1000)

        // Check for queued notifications every ten seconds
        setInterval(intervals.sendNotifications, 10 * 1000)

        // Check for completed orders every 15 minutes
        setInterval(intervals.completeOrders, 15 * 60 * 1000)
    } catch (err) {
        console.log('Error connecting to MongoDB', err)
        throw err
    }
}

module.exports = mongooseClient
