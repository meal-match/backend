const express = require('express')

const stripeClient = require('../services/stripeClient')
const { isAuthenticated } = require('../utils/authUtils')
const User = require('../models/user')

const app = express()

// Route to save a payout method by fetching or creating a payout setup intent
app.get('/setup-intent', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(
            req.session.userId,
            'email payoutSetupIntent'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const customer = await stripeClient.customers.list({
            email: user.email,
            limit: 1
        })
        if (!customer.data.length) {
            return res.status(400).json({
                message: 'Customer does not exist'
            })
        }

        const customerID = customer.data[0].id

        // If no setup intent is found then create a new one
        if (!user.paymentSetupIntent) {
            const setupIntent = await stripeClient.setupIntents.create({
                customer: customerID,
                payment_method_types: ['us_bank_account']
            })

            user.payoutSetupIntent = setupIntent.client_secret
            await user.save()
        }

        res.status(200).json({
            payoutSetupIntent: user.payoutSetupIntent
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route to conclude the payout setup process
app.delete('/setup-intent', isAuthenticated, async (req, res) => {
    const { isDefault } = req.body
    try {
        const user = await User.findById(
            req.session.userId,
            'email paymentSetupIntent payoutMethods'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const customer = await stripeClient.customers.list({
            email: user.email,
            limit: 1
        })
        if (!customer.data.length) {
            return res.status(400).json({
                message: 'Customer does not exist'
            })
        }

        const stripePayoutMethods = await stripeClient.paymentMethods.list({
            customer: customer.data[0].id
        })

        if (stripePayoutMethods.data.length) {
            const newMethod = stripePayoutMethods.data.filter(
                (method) =>
                    method.type === 'us_bank_account' &&
                    !user.payoutMethods.find((pm) => pm.id === method.id)
            )
            let message = 'No new payout method found'

            if (newMethod.length) {
                user.paymentSetupIntent = null
                user.payoutMethods.push({
                    id: newMethod[0].id,
                    default: isDefault || false
                })
                await user.save()
                message = 'Payout method added successfully'
            }

            const payoutMethods = await stripeClient.fetchPayoutMethods(user)

            res.status(200).json({
                message,
                payoutMethods
            })
        } else {
            res.status(400).json({
                message: 'No payout method found'
            })
        }
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route to change the default payout method
app.patch('/default-method/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params
    try {
        const user = await User.findById(
            req.session.userId,
            'email paymentSetupIntent payoutMethods'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const payoutMethod = user.payoutMethods.find((pm) => pm.id === id)
        if (!payoutMethod) {
            return res.status(404).json({
                message: 'Payout method not found'
            })
        }

        const currentDefault = user.payoutMethods.find((pm) => pm.default)
        if (currentDefault) {
            currentDefault.default = false
        }
        payoutMethod.default = true
        await user.save()

        const payoutMethods = await stripeClient.fetchPayoutMethods(user)

        res.status(200).json({
            message: 'Default payout method updated successfully',
            payoutMethods
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route to delete a payout method
app.delete('/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params
    try {
        const user = await User.findById(
            req.session.userId,
            'email payoutMethods'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        if (!user.payoutMethods.find((pm) => pm.id === id)) {
            return res.status(404).json({
                message: 'Payout method not found'
            })
        }

        await stripeClient.paymentMethods.detach(id)

        user.payoutMethods = user.payoutMethods.filter((pm) => pm.id !== id)
        await user.save()

        const payoutMethods = await stripeClient.fetchPayoutMethods(user)

        res.status(200).json({
            message: 'Payout method deleted successfully',
            payoutMethods
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

module.exports = app
