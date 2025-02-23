const express = require('express')
const Order = require('../models/order')
const { uploadImageToCloudinary } = require('../services/cloudinaryClient')
const User = require('../models/user')
const { isAuthenticated } = require('../utils/authUtils')
const expoClient = require('../services/expoClient')
const stripeClient = require('../services/stripeClient')

const app = express()

// Route to fetch open orders that need a seller
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId, 'openOrders')
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const canClaimOrder = !user.openOrders.find(
            (order) => order.type === 'sell'
        )

        const now = new Date()
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000)

        const pendingOrders = await Order.find({
            status: 'Pending',
            desiredPickupTime: {
                $gte: now,
                $lte: thirtyMinutesFromNow
            },
            // Allow a buyer to claim their own order in dev mode
            buyer: {
                $ne:
                    process.env.ENVIRONMENT === 'dev'
                        ? null
                        : req.session.userId
            }
        })

        res.status(200).json({
            orders: pendingOrders,
            canClaimOrder
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route for a buyer to create a new order
app.post('/buy', isAuthenticated, async (req, res) => {
    const {
        restaurant,
        entree,
        entreeCustomizations,
        side,
        sideCustomizations,
        drink,
        drinkCustomizations,
        sauces,
        pickupTime
    } = req.body
    try {
        const user = await User.findById(
            req.session.userId,
            'openOrders paymentMethods email'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const defaultPaymentMethod =
            await stripeClient.fetchDefaultPaymentMethod(user)
        if (!defaultPaymentMethod) {
            return res.status(400).json({
                message: 'User does not have a payment method'
            })
        }

        const order = new Order({
            buyer: user._id,
            restaurant,
            meal: {
                entree,
                entreeCustomizations,
                side,
                sideCustomizations,
                drink,
                drinkCustomizations,
                sauces
            },
            desiredPickupTime: pickupTime
        })
        await order.save()

        user.openOrders.push({
            id: order._id,
            type: 'buy'
        })
        await user.save()

        res.status(201).json({
            message: 'Order created successfully',
            orderID: order._id
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route for a buyer to cancel an order
app.delete('/:id/cancel-buy', isAuthenticated, async (req, res) => {
    const { id } = req.params
    try {
        const order = await Order.findById(id)
        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            })
        }

        const user = await User.findById(req.session.userId, 'openOrders')
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        if (order.buyer.toString() !== req.session.userId) {
            return res.status(401).json({
                message: 'Unauthorized'
            })
        }

        if (order.status === 'Pending') {
            await Order.findByIdAndDelete(id)

            user.openOrders = user.openOrders.filter(
                (order) => order.id.toString() !== id || order.type !== 'buy'
            )
            await user.save()

            res.status(200).json({
                message: 'Order cancelled successfully'
            })
        } else {
            return res.status(400).json({
                message: 'Order cannot be cancelled'
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route for a seller to claim a specific order
app.patch('/:id/claim', isAuthenticated, async (req, res) => {
    const { id } = req.params
    try {
        const order = await Order.findById(id)
        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            })
        }

        if (order.status !== 'Pending') {
            return res.status(400).json({
                message: 'Order cannot be claimed'
            })
        }

        const user = await User.findById(
            req.session.userId,
            'openOrders stripeAccountId'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const isPayoutSetupComplete =
            await stripeClient.checkIfAccountSetupIsComplete(
                user.stripeAccountId
            )
        if (!isPayoutSetupComplete) {
            return res.status(400).json({
                message: 'Payout account not set up'
            })
        }

        if (user.openOrders.find((order) => order.type === 'sell')) {
            return res.status(400).json({
                message: 'User already has an open sell order'
            })
        }

        order.status = 'Claimed'
        order.seller = req.session.userId
        order.claimTime = new Date()
        await order.save()

        user.openOrders.push({
            id: order._id,
            type: 'sell'
        })
        await user.save()

        res.status(200).json({
            message: 'Order claimed successfully'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route for a seller to unclaim an order
app.patch('/:id/unclaim', isAuthenticated, async (req, res) => {
    const { id } = req.params
    try {
        const order = await Order.findById(id)
        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            })
        }

        const user = await User.findById(req.session.userId, 'openOrders')
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        if (order.status !== 'Claimed') {
            return res.status(400).json({
                message: 'Order cannot be unclaimed'
            })
        }

        if (order.seller.toString() !== req.session.userId) {
            return res.status(401).json({
                message: 'Unauthorized'
            })
        }

        order.status = 'Pending'
        order.seller = null
        order.claimTime = null
        await order.save()

        user.openOrders = user.openOrders.filter(
            (order) => order.id.toString() !== id || order.type !== 'sell'
        )
        await user.save()

        res.status(200).json({
            message: 'Order unclaimed successfully'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route for a seller to confirm an order
app.patch(
    '/:id/confirm',
    uploadImageToCloudinary.single('receipt'),
    isAuthenticated,
    async (req, res) => {
        const { id } = req.params
        const { readyTime } = req.body

        try {
            const order = await Order.findById(id)
            if (!order) {
                return res.status(404).json({
                    message: 'Order not found'
                })
            }

            const user = await User.findById(
                req.session.userId,
                'openOrders firstName lastName'
            )
            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                })
            }

            if (order.status !== 'Claimed') {
                return res.status(400).json({
                    message:
                        'Order is not claimed and therefore cannot be confirmed'
                })
            }

            if (order.seller.toString() !== req.session.userId) {
                return res.status(401).json({
                    message: 'Unauthorized'
                })
            }

            if (!/^(0?[1-9]|1[0-2]):[0-5]\d\s?[APap][Mm]$/.test(readyTime)) {
                return res.status(400).json({
                    message: 'Invalid ready time format'
                })
            }

            // Validate that an image was uploaded
            if (!req.file) {
                return res
                    .status(400)
                    .json({ message: 'Receipt image is required' })
            }

            // Validate image format (only PNG for now)
            const allowedFormats = ['image/png']
            if (!allowedFormats.includes(req.file.mimetype)) {
                return res.status(400).json({
                    message: 'Invalid image format. PNG is allowed.'
                })
            }

            const buyer = await User.findById(
                order.buyer.toString(),
                'email paymentMethods pushToken'
            )
            if (!buyer) {
                return res.status(404).json({
                    message: 'Buyer not found'
                })
            }

            const paymentMethod =
                await stripeClient.fetchDefaultPaymentMethod(buyer)
            if (!paymentMethod) {
                return res.status(400).json({
                    message: 'No payment method found for the buyer'
                })
            }

            const customer = await stripeClient.fetchCustomer(buyer.email)
            if (!customer) {
                return res.status(400).json({
                    message: 'Customer not found'
                })
            }

            await stripeClient.paymentIntents.create({
                amount: 600,
                currency: 'usd',
                payment_method: paymentMethod.id,
                confirm: true,
                receipt_email: buyer.email,
                customer: customer.id,
                off_session: true,
                description: `Payment for order ${order._id}`
            })

            order.status = 'Confirmed'
            order.readyTime = readyTime
            order.confirmationTime = new Date()
            order.receiptImage = req.file.path
            order.sellerName = `${user.firstName} ${user.lastName}`

            await order.save()

            if (buyer?.pushToken) {
                expoClient.queueNotification({
                    to: buyer.pushToken,
                    title: 'Order Confirmed',
                    body: `Your ${order.restaurant} order is confirmed and will be ready at ${readyTime}! The name to use for pickup is ${order.sellerName}.`,
                    data: {
                        route: `/openOrders/orderDetails?id=${order._id}`
                    }
                })
            }

            res.status(200).json({
                message: 'Order confirmed successfully'
            })
        } catch (err) {
            console.log(err)
            res.status(500).json({
                message: 'Internal server error'
            })
        }
    }
)

app.patch('/:id/dispute', isAuthenticated, async (req, res) => {
    const { id } = req.params
    const { reason } = req.body
    try {
        const order = await Order.findById(id)
        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            })
        }

        if (!reason) {
            return res.status(400).json({
                message: 'Dispute reason is required'
            })
        }

        const user = await User.findById(req.session.userId, 'openOrders')
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found'
            })
        }

        if (order.status !== 'Confirmed') {
            return res.status(400).json({
                message: 'Order must be confirmed to be disputed'
            })
        }

        if (order.buyer.toString() !== req.session.userId) {
            return res.status(401).json({
                message: 'You must be the buyer to dispute an order'
            })
        }

        // Send notification to seller
        const seller = await User.findById(order.seller.toString(), 'pushToken')
        if (seller?.pushToken) {
            expoClient.queueNotification({
                to: seller.pushToken,
                title: 'Order Disputed',
                body: `Your order from ${order.restaurant} has been disputed by the buyer. We will review the issue and get back to you soon. Your payment will be held until the issue is resolved.`,
                data: {
                    route: `/openOrders/${order._id}`
                }
            })
        }

        // TODO: send email to seller
        // TODO: send email to admin

        order.status = 'Disputed'
        order.disputeTime = new Date()
        order.disputeReason = reason
        await order.save()

        res.status(200).json({
            message: 'Order disputed successfully'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route to fetch open orders for a user
app.get('/open', isAuthenticated, async (req, res) => {
    try {
        const userID = req.session.userId

        const openOrders = await Order.find({
            $or: [{ buyer: userID }, { seller: userID }]
        }).lean()

        res.status(200).json({
            orders: openOrders.map((order) => {
                const isBuy = order.buyer.toString() === userID
                order.type = isBuy ? 'buy' : 'sell'
                order.buyer = undefined
                order.seller = undefined
                return order
            })
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

module.exports = app
