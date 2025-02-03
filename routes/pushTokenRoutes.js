const express = require('express')
const User = require('../models/user')
const { Expo } = require('expo-server-sdk')
const { isAuthenticated } = require('../utils/authUtils')

const app = express()

// Route to save a push token
app.post('/', isAuthenticated, async (req, res) => {
    try {
        const { pushToken } = req.body
        if (!pushToken) {
            return res.status(400).json({
                message: 'Missing push token'
            })
        }

        const user = await User.findById(req.session.userId, 'pushToken')
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        if (!Expo.isExpoPushToken(pushToken)) {
            user.pushToken = null
            return res.status(400).json({
                message: 'Invalid push token'
            })
        }

        if (user.pushToken === pushToken) {
            return res.status(200).json({
                message: 'Push token already saved'
            })
        }

        // Save push token to user
        user.pushToken = pushToken
        await user.save()
        res.status(201).json({
            message: 'Push token saved'
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

module.exports = app
