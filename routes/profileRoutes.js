const express = require('express')
const User = require('../models/user')

const app = express()

const isAuthenticated = (req, res, next) => {
    if (req.session?.userId) {
        next()
    } else {
        res.status(401).json({
            status: 401,
            message: 'Unauthorized'
        })
    }
}

// Profile route
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(
            req.session.userId,
            'firstName lastName email openOrders'
        )
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found'
            })
        }
        res.status(200).json({ ...user._doc, status: 200 }) // Return user profile data
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        })
    }
})

module.exports = app
