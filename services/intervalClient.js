require('dotenv').config()
const Order = require('../models/order')
const User = require('../models/user')
const expoClient = require('./expoClient')
const { cloudinary } = require('./cloudinaryClient')

const intervals = {}

const deleteImageFromCloudinary = async (imageUrl) => {
    if (!imageUrl) {
        return
    }

    // Extract public_id from Cloudinary URL
    const parts = imageUrl.split('/')
    const filename = parts[parts.length - 1] // Get filename
    const publicId =
        process.env.CLOUDINARY_FOLDER +
        '/' +
        filename.substring(0, filename.lastIndexOf('.')) // Remove extension

    try {
        await cloudinary.uploader.destroy(publicId)
        console.log(`Deleted image: ${publicId}`)
    } catch (err) {
        console.error('Error deleting image from Cloudinary:', err)
    }
}

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

// TODO: check for reports signaling that an order was not completed for some reason
// TODO: pay seller
intervals.completeOrders = async () => {
    let completionCount = 0

    // Loop through orders
    const orders = await Order.find()
    for (const order of orders) {
        try {
            // If order is confirmed and it's been more than 3 hours since confirmation time
            if (
                order.status === 'Confirmed' &&
                Date.now() - order.confirmationTime.getTime() >
                    3 * 60 * 60 * 1000
            ) {
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
                            title: 'Order Completed',
                            body: 'Your order was completed.'
                        })
                    }
                }

                // Delete receipt image from Cloudinary
                await deleteImageFromCloudinary(order.receiptImage)

                // Update order
                order.status = 'Completed'
                await order.save()

                completionCount++
            }
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
