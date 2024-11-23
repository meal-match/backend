const crypto = require('crypto')
const dotenv = require('dotenv')
const express = require('express')
const emailClient = require('../services/emailClient')
const stripeClient = require('../services/stripeClient')
const User = require('../models/user')

const app = express()
dotenv.config()

const sendVerificationEmail = async (email, verificationToken) => {
    const subject = 'Verify Email'
    const html = `
            <p>You are receiving this because you (or someone else) have signed up for a MealMatch account. Click the link below to verify your email:</p>
            <a href="${process.env.CLIENT_URL}/auth/verifyEmail?token=${verificationToken}">Verify Email</a>
            <p>If you cannot click the link above, copy and paste the following URL into your browser:</p>
            <p>${process.env.CLIENT_URL}/auth/verifyEmail?token=${verificationToken}</p>`
    await emailClient.sendEmail({ to: email, subject, html })
}

// Sign up route
app.post('/signup', async (req, res) => {
    const { email, password, firstName, lastName } = req.body

    try {
        const user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({
                message: 'Email already exists'
            })
        }

        const isVerified = process.env.ENVIRONMENT === 'dev' // Automatically verify user in dev environment
        const verificationToken = crypto.randomBytes(32).toString('hex')

        const stripeCustomer = await stripeClient.customers.create({
            email: email.toLowerCase(),
            name: `${firstName} ${lastName}`
        })

        const setupIntent = await stripeClient.setupIntents.create({
            customer: stripeCustomer.id,
            payment_method_types: ['card']
        })

        const paymentSetupIntent = setupIntent.client_secret

        await User.create({
            email,
            password,
            firstName,
            lastName,
            isVerified,
            verificationToken,
            paymentSetupIntent
        })

        await sendVerificationEmail(email, verificationToken)

        res.status(201).json({
            message:
                'User created successfully. Please check your email for a link to verify your email.'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
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
                message: 'Unauthorized'
            })
        }

        const isMatch = await user.comparePassword(password)

        if (isMatch) {
            if (!user.isVerified) {
                await sendVerificationEmail(email, user.verificationToken)
                return res.status(403).json({
                    message:
                        "Your email is not verified. We've resent an email with a verification link."
                })
            }

            req.session.userId = user._id
            res.status(200).json({
                message: 'Logged in successfully'
            })
        } else {
            res.status(401).json({
                message: 'Unauthorized'
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err)
            return res.status(500).json({
                message: 'Internal server error'
            })
        }
        res.clearCookie('connect.sid')
        res.status(200).json({
            message: 'Logged out successfully'
        })
    })
})

// Route to check if a user is logged in
app.get('/status', async (req, res) => {
    if (req.session?.userId) {
        res.status(200).json({
            message: 'Logged in'
        })
    } else {
        res.status(401).json({
            message: 'Not logged in'
        })
    }
})

// Route to send email with password reset link
app.post('/send-reset', async (req, res) => {
    const { email } = req.body

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(401).json({
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
            <a href="${process.env.CLIENT_URL}/auth/resetPassword?token=${token}">Reset Password</a>
            <p>If you cannot click the link above, copy and paste the following URL into your browser:</p>
            <p>${process.env.CLIENT_URL}/auth/resetPassword?token=${token}</p>`
        await emailClient.sendEmail({ to: email, subject, html })
        res.status(200).json({
            message: 'Password reset link sent'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Reset password route
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
                message: 'Password reset token is invalid or has expired.'
            })
        }

        // Make sure new password is different from the old password
        if (await user.comparePassword(password)) {
            return res.status(400).json({
                message: 'New password must be different from the old password'
            })
        }

        // Update the user's password
        user.password = password
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined

        // Save the updated user
        await user.save()

        res.status(200).json({
            message: 'Password reset successfully'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Verify email route
app.post('/verify', async (req, res) => {
    const { token } = req.body

    try {
        // Find the user by the token and check if it hasn't expired
        const user = await User.findOne({ verificationToken: token })

        if (!user) {
            return res.status(400).json({
                message: 'Invalid token'
            })
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: 'Email is already verified'
            })
        }

        // Mark the user as verified and remove the token
        user.isVerified = true
        user.verificationToken = undefined
        await user.save()

        res.status(200).json({
            message: 'Email verified successfully'
        })
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

module.exports = app
