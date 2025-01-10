const express = require('express')
const Order = require('../models/order')
const User = require('../models/user')
const { isAuthenticated } = require('../utils/authUtils')

const app = express()

// Route to fetch profile data
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(
            req.session.userId,
            'firstName lastName email paymentSetupIntent openOrders paymentMethods'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }
        res.status(200).json({ ...user._doc }) // Return user profile data
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route to delete a user
app.delete('/', isAuthenticated, async (req, res) => {
    try {
        const userID = req.session.userId

        // Check if user has open orders
        const openOrders = await Order.find({
            $or: [{ buyer: userID }, { seller: userID }]
        })
        if (openOrders.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete user with open orders'
            })
        }

        // Logout user
        req.session.destroy(async (err) => {
            if (err) {
                console.log(err)
                return res.status(500).json({
                    message: 'Internal server error'
                })
            }

            res.clearCookie('connect.sid')

            // Delete user
            const user = await User.findByIdAndDelete(userID)
            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                })
            }
            res.status(200).json({
                message: 'User deleted successfully'
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
