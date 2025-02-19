const Order = require('../models/order')
const User = require('../models/user')
const expoClient = require('./expoClient')
const { deleteImageFromCloudinary } = require('./cloudinaryClient')
const stripeClient = require('./stripeClient')

const intervals = {}

intervals.deleteUnclaimedOrders = async () => {
    let deletionCount = 0

    // Loop through unclaimed orders that have a pickup time in less than 5 minutes
    const orders = await Order.find({
        status: 'Pending',
        desiredPickupTime: {
            $exists: true,
            $lte: new Date(Date.now() + 5 * 60 * 1000)
        }
    })
    for (const order of orders) {
        try {
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

    // Loop through orders that were claimed more than 7 minutes ago
    const orders = await Order.find({
        status: 'Claimed',
        claimTime: {
            $exists: true,
            $lte: new Date(Date.now() - 7 * 60 * 1000)
        }
    })
    for (const order of orders) {
        try {
            // Update seller's open orders
            const sellerID = order.seller
            const seller = await User.findById(sellerID, 'openOrders pushToken')
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

intervals.completeOrders = async () => {
    let completionCount = 0

    // Loop through orders that were confirmed at least 3 hours ago
    const orders = await Order.find({
        status: 'Confirmed',
        confirmationTime: {
            $exists: true,
            $lte: new Date(Date.now() - 3 * 60 * 60 * 1000)
        }
    })
    for (const order of orders) {
        try {
            // Update buyer's open orders
            const buyerID = order.buyer
            const buyer = await User.findById(buyerID, 'openOrders')
            if (buyer) {
                buyer.openOrders = buyer.openOrders.filter(
                    (openOrder) =>
                        openOrder.id.toString() !== order._id.toString() ||
                        openOrder.type !== 'buy'
                )
                await buyer.save()
            }

            // Update seller's open orders, pay seller, and notify seller
            const sellerID = order.seller
            const seller = await User.findById(
                sellerID,
                'openOrders stripeAccountId pushToken'
            )
            if (seller) {
                seller.openOrders = seller.openOrders.filter(
                    (openOrder) =>
                        openOrder.id.toString() !== order._id.toString() ||
                        openOrder.type !== 'sell'
                )
                await seller.save()

                if (seller.stripeAccountId) {
                    await stripeClient.transfers.create({
                        amount: 500,
                        currency: 'usd',
                        destination: seller.stripeAccountId,
                        description: `Payout for order ${order._id}`
                    })
                }

                if (seller.pushToken) {
                    expoClient.queueNotification({
                        to: seller.pushToken,
                        title: 'Order Completed',
                        body: 'Your sale was completed. You should receive a payout soon.'
                    })
                }
            }

            // Delete receipt image from Cloudinary
            await deleteImageFromCloudinary(order.receiptImage)

            // Update order
            order.status = 'Completed'
            order.completionTime = new Date()
            await order.save()

            completionCount++
        } catch (e) {
            console.error(
                'An error occured while completing order with ID: ',
                order._id,
                e
            )
        }
    }

    if (completionCount > 0) {
        console.log(`Completed ${completionCount} orders`)
    }
}

module.exports = intervals
