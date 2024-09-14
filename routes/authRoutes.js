const express = require('express')
const User = require('../models/user')

const app = express()
app.use(express.json())

// Sign up route
app.post('/signup', async (req, res) => {
    const { email, password, firstName, lastName } = req.body

    try {
        await User.create({ email, password, firstName, lastName })
        res.status(201).send('User created')
    } catch (err) {
        res.status(500).send('Internal server error:\n' + err)
    }
})

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(401).send('Unauthorized')
        }

        const isMatch = await user.comparePassword(password)

        if (isMatch) {
            req.session.userId = user._id
            res.status(200).send('Login successful')
        } else {
            res.status(401).send('Unauthorized')
        }
    } catch (err) {
        res.status(500).send('Internal server error:\n' + err)
    }
})

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Internal server error:\n' + err)
        }
        res.clearCookie('connect.sid')
        res.status(200).send('Logged out successfully')
    })
})

module.exports = app
