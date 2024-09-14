const express = require('express')
const User = require('../models/user')

const app = express()

const isAuthenticated = (req, res, next) => {
    if (req.session?.userId) {
        next()
    } else {
        res.status(401).send('Unauthorized')
    }
}

// Profile route
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(
            req.session.userId,
            'firstName lastName email'
        )
        if (!user) {
            return res.status(404).send('User not found')
        }
        res.status(200).json(user) // Return user profile data
    } catch (err) {
        res.status(500).send('Internal server error')
    }
})

module.exports = app
