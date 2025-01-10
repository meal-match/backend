const Order = require('../models/order')
const User = require('../models/user')

const intervals = {}

intervals.deleteUnclaimedOrders = async () => {
    // loop through orders
    let deletionCount = 0
    const orders = await Order.find()
    for (const order of orders) {
        try {
            const date = new Date(order.desiredPickupTime)

            // if order is unclaimed and desired pickup time is less than 5 minutes
            if (
                order.status === 'Pending' &&
                Date.now() - date.getTime() > 5 * 60 * 1000
            ) {
                // delete order
                await Order.findByIdAndDelete(order._id)

                // update user
                const user = await User.findById(order.buyer)
                if (user) {
                    user.openOrders = user.openOrders.filter(
                        (openOrder) =>
                            openOrder.id.toString() !== order._id.toString()
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

module.exports = intervals
