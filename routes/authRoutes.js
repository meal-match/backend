const express = require('express')
const User = require('../models/user')

const app = express()

// Sign up route
app.post('/signup', async (req, res) => {
    const { email, password, firstName, lastName } = req.body

    try {
        await User.create({ email, password, firstName, lastName })
        res.status(201).json({
            status: 201,
            message: 'User created successfully'
        })
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: 'Internal server error: ' + err
        })
    }
})

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(401).json({
                status: 401,
                message: 'Unauthorized'
            })
        }

        const isMatch = await user.comparePassword(password)

        if (isMatch) {
            req.session.userId = user._id
            res.status(200).json({
                status: 200,
                message: 'Logged in successfully'
            })
        } else {
            res.status(401).json({
                status: 401,
                message: 'Unauthorized'
            })
        }
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: 'Internal server error: ' + err
        })
    }
})

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Internal server error:\n' + err)
        }
        res.clearCookie('connect.sid')
        res.status(200).json({
            status: 200,
            message: 'Logged out successfully'
        })
    })
})

module.exports = app
