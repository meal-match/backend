const Order = require('../models/order')
const User = require('../models/user')
const expoClient = require('./expoClient')

const intervals = {}

intervals.deleteUnclaimedOrders = async () => {
    // Loop through orders
    let deletionCount = 0
    const orders = await Order.find()
    for (const order of orders) {
        try {
            const pickupTime = new Date(order.desiredPickupTime)

            // If order is unclaimed and desired pickup time is less than 5 minutes
            if (
                order.status === 'Pending' &&
                Date.now() - pickupTime.getTime() > 5 * 60 * 1000
            ) {
                // Delete order
                await Order.findByIdAndDelete(order._id)

                // Update user
                const user = await User.findById(
                    order.buyer,
                    'openOrders pushToken'
                )
                if (user) {
                    user.openOrders = user.openOrders.filter(
                        (openOrder) =>
                            openOrder.id.toString() !== order._id.toString() ||
                            openOrder.type !== 'buy'
                    )
                    await user.save()

                    if (user.pushToken) {
                        expoClient.queueNotification({
                            to: user.pushToken,
                            title: 'Order Deleted',
                            body: 'Your order was deleted due to inactivity.'
                        })
                    }
                }

                deletionCount++
            }
        } catch (e) {
            console.error(
                'An error occured while deleting unclaimed order with ID: ',
                order._id,
                e
            )
        }
    }

    if (deletionCount > 0) {
        console.log(`Deleted ${deletionCount} unclaimed orders`)
    }
}

intervals.sellerTimeout = async () => {
    let timeoutCount = 0

    // Loop through orders
    const orders = await Order.find()
    for (const order of orders) {
        try {
            const claimTime = new Date(order.claimTime)

            // If order is claimed and it's been more than 7 minutes since claim time
            if (
                order.status === 'Claimed' &&
                (!order.claimTime ||
                    Date.now() - claimTime.getTime() > 7 * 60 * 1000)
            ) {
                // Update seller's open orders
                const sellerID = order.seller
                const seller = await User.findById(
                    sellerID,
                    'openOrders pushToken'
                )
                if (seller) {
                    seller.openOrders = seller.openOrders.filter(
                        (openOrder) =>
                            openOrder.id.toString() !== order._id.toString() ||
                            openOrder.type !== 'sell'
                    )
                    await seller.save()

                    if (seller.pushToken) {
                        expoClient.queueNotification({
                            to: seller.pushToken,
                            title: 'Order Unclaimed',
                            body: 'Your order was unclaimed due to inactivity.'
                        })
                    }
                }

                // Update order
                order.status = 'Pending'
                order.seller = null
                await order.save()

                timeoutCount++
            }
        } catch (e) {
            console.error(
                'An error occured while unclaiming order with ID: ',
                order._id,
                e
            )
        }
    }

    if (timeoutCount > 0) {
        console.log(`Unclaimed ${timeoutCount} orders`)
    }
}

intervals.sendNotifications = async () => {
    const notificationCount = expoClient.notificationQueue.length
    if (notificationCount > 0) {
        await expoClient.sendQueuedNotifications()
        console.log(`Sent ${notificationCount} notifications`)
    }
}

module.exports = intervals
