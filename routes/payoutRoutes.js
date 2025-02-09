const express = require('express')
const stripeClient = require('../services/stripeClient')
const User = require('../models/user')

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

app.post('/account-link', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId, 'stripeAccountId')
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

        // TODO: add refresh and return URLs
        const accountLink = await stripeClient.accountLinks.create({
            account: user.stripeAccountId,
            refresh_url: 'https://mealmatchbama.vercel.app/',
            return_url: 'https://mealmatchbama.vercel.app/',
            type: 'account_onboarding'
        })

        res.status(201).json({
            accountLink: accountLink.url
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

// TODO: remove these routes
app.post('/test-payout', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId, 'stripeAccountId')
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

        await stripeClient.transfers.create({
            amount: 400,
            currency: 'usd',
            destination: user.stripeAccountId,
            description: 'Test payout'
        })

        res.status(201).json({
            message: 'Payment successful'
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

app.post('/test-payment', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(
            req.session.userId,
            'paymentMethods email'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const paymentMethod = await stripeClient.fetchDefaultPaymentMethod(user)
        if (!paymentMethod) {
            return res.status(400).json({
                message: 'Payment method not found'
            })
        }

        const customer = await stripeClient.fetchCustomer(user.email)
        if (!customer) {
            return res.status(400).json({
                message: 'Customer not found'
            })
        }

        await stripeClient.paymentIntents.create({
            amount: 400,
            currency: 'usd',
            payment_method: paymentMethod.id,
            confirm: true,
            receipt_email: user.email,
            customer: customer.id,
            off_session: true,
            description: 'Test payment'
        })

        res.status(201).json({
            message: 'Payment successful'
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

module.exports = app
