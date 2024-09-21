const crypto = require('crypto')
const dotenv = require('dotenv')
const emailClient = require('../services/emailClient')
const express = require('express')
const User = require('../models/user')

const app = express()
dotenv.config()

// Sign up route
app.post('/signup', async (req, res) => {
    const { email, password, firstName, lastName } = req.body

    try {
        const user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({
                status: 400,
                message: 'Email already exists'
            })
        }
        await User.create({ email, password, firstName, lastName })
        res.status(201).json({
            status: 201,
            message: 'User created successfully'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
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
        console.log(err)
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        })
    }
})

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err)
            return res.status(500).json({
                status: 500,
                message: 'Internal server error'
            })
        }
        res.clearCookie('connect.sid')
        res.status(200).json({
            status: 200,
            message: 'Logged out successfully'
        })
    })
})

app.post('/send-reset', async (req, res) => {
    const { email } = req.body

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(401).json({
                status: 401,
                message: 'Email not found'
            })
        }

        // Generate a reset token and set an expiration time (1 hour in this case)
        const token = crypto.randomBytes(20).toString('hex')
        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
        await user.save()

        // Send email with password reset link
        const subject = 'Password Reset'
        const html = `
            <p>You are receiving this because you (or someone else) have requested the reset of the password for your account. Click the link below to reset your password:</p>
            <a href="${process.env.CLIENT_URL}/auth/resetPassword?token=${token}">Reset Password</a>`
        await emailClient.sendEmail({ to: email, subject, html })
        res.status(200).json({
            status: 200,
            message: 'Password reset link sent'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        })
    }
})

app.post('/reset-password', async (req, res) => {
    const { token, password } = req.body

    try {
        // Find the user by the token and ensure it hasn't expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Token expiry check
        })

        if (!user) {
            return res.status(400).json({
                status: 400,
                message: 'Password reset token is invalid or has expired.'
            })
        }

        // Update the user's password
        user.password = password
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined

        // Save the updated user
        await user.save()

        res.status(200).json({
            status: 200,
            message: 'Password reset successfully'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        })
    }
})

module.exports = app
