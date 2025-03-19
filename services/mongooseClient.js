const mongoose = require('mongoose')
const intervalClient = require('./intervalClient')

const mongooseClient = {}

mongooseClient.connect = async (mongoUrl) => {
    try {
        await mongoose.connect(mongoUrl)
        console.log('Connected to MongoDB')

        if (process.env.LOCAL === 'true') {
            // Build local-dev versions of the interval clients
            console.log('Building local interval clients')

            // Check every 15 minutes
            setInterval(intervalClient.completeOrders, 15 * 60 * 1000)

            // Check every minute
            setInterval(() => {
                intervalClient.deleteUnclaimedOrders()
                intervalClient.sendReadyNotifications()
                intervalClient.sellerTimeout()
            }, 60 * 1000)
        }
    } catch (err) {
        console.log('Error connecting to MongoDB', err)
        throw err
    }
}

module.exports = mongooseClient
