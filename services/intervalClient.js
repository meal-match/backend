const Order = require('../models/order')
const User = require('../models/user')

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
                const user = await User.findById(order.buyer)
                if (user) {
                    user.openOrders = user.openOrders.filter(
                        (openOrder) =>
                            openOrder.id.toString() !== order._id.toString() ||
                            openOrder.type !== 'buy'
                    )
                    await user.save()
                }

                // TODO: notify the user that their order was deleted

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
                const seller = await User.findById(sellerID)
                if (seller) {
                    seller.openOrders = seller.openOrders.filter(
                        (openOrder) =>
                            openOrder.id.toString() !== order._id.toString() ||
                            openOrder.type !== 'sell'
                    )
                    await seller.save()
                }

                // Update order
                order.status = 'Pending'
                order.seller = null
                await order.save()

                // TODO: notify the seller that their order was unclaimed due to timeout

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

module.exports = intervals
