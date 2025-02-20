const express = require('express')
const stripeClient = require('../services/stripeClient')
const User = require('../models/user')
const crypto = require('node:crypto')

const { isAuthenticated } = require('../utils/authUtils')

const app = express()

app.post('/account', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId, 'stripeAccountId')
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        if (user.stripeAccountId) {
            const setupIsComplete =
                await stripeClient.checkIfAccountSetupIsComplete(
                    user.stripeAccountId
                )
            return res.status(200).json({
                message: 'Account already created',
                account: user.stripeAccountId,
                setupIsComplete
            })
        }

        const account = await stripeClient.accounts.create({
            controller: {
                stripe_dashboard: {
                    type: 'none'
                },
                fees: {
                    payer: 'application'
                },
                losses: {
                    payments: 'application'
                },
                requirement_collection: 'application'
            },
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true }
            },
            country: 'US'
        })

        if (!account) {
            return res.status(500).json({
                message: 'Failed to create account'
            })
        }

        user.stripeAccountId = account.id
        await user.save()

        res.status(201).json({
            account: account.id,
            setupIsComplete: false
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

app.post('/account-link', async (req, res) => {
    const { token } = req.body
    try {
        // We either need to be logged in or have a refresh token
        if (!req.session?.userId && !token) {
            return res.status(401).json({
                message: 'Unauthorized'
            })
        }

        let user
        if (req.session.userId) {
            user = await User.findById(
                req.session.userId,
                'stripeAccountId stripeRefreshToken'
            )
        } else {
            user = await User.findOne(
                { stripeRefreshToken: token },
                'stripeAccountId stripeRefreshToken'
            )
        }

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }
        if (!user.stripeAccountId) {
            return res.status(400).json({
                message: 'Account not created'
            })
        }

        const setupIsComplete =
            await stripeClient.checkIfAccountSetupIsComplete(
                user.stripeAccountId
            )

        user.stripeRefreshToken = crypto.randomBytes(32).toString('hex')
        await user.save()

        const accountLink = await stripeClient.accountLinks.create({
            account: user.stripeAccountId,
            refresh_url: `${process.env.WEBSITE_URL}/stripe/refresh?token=${user.stripeRefreshToken}`,
            return_url: `${process.env.WEBSITE_URL}/stripe/complete`,
            type: setupIsComplete ? 'account_update' : 'account_onboarding'
        })

        res.status(201).json({
            accountLink: accountLink.url,
            setupIsComplete
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

app.get('/account-status', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId, 'stripeAccountId')
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }
        if (!user.stripeAccountId) {
            return res.status(200).json({
                setupIsComplete: false
            })
        }

        const setupIsComplete =
            await stripeClient.checkIfAccountSetupIsComplete(
                user.stripeAccountId
            )

        res.status(200).json({
            setupIsComplete
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

module.exports = app
