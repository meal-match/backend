const express = require('express')
const User = require('../models/user')
const { isAuthenticated } = require('../utils/authUtils')

const app = express()

// Profile route
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(
            req.session.userId,
            'firstName lastName email paymentSetupIntent'
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

module.exports = app
