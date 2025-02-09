const express = require('express')

const stripeClient = require('../services/stripeClient')
const { isAuthenticated } = require('../utils/authUtils')
const User = require('../models/user')

const app = express()

// Route to save a payment method by fetching or creating a payment setup intent
app.get('/setup-intent', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(
            req.session.userId,
            'email paymentSetupIntent'
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
                payment_method_types: ['card']
            })

            user.paymentSetupIntent = setupIntent.client_secret
            await user.save()
        }

        const ephemeralKey = await stripeClient.ephemeralKeys.create(
            { customer: customerID },
            { apiVersion: '2024-06-20' }
        )

        res.status(200).json({
            paymentSetupIntent: user.paymentSetupIntent,
            ephemeralKey: ephemeralKey.secret,
            customer: customerID
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route to conclude the payment setup process
app.delete('/setup-intent', isAuthenticated, async (req, res) => {
    const { isDefault } = req.body
    try {
        const user = await User.findById(
            req.session.userId,
            'email paymentSetupIntent paymentMethods'
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

        const stripePaymentMethods = await stripeClient.paymentMethods.list({
            customer: customer.data[0].id
        })

        if (stripePaymentMethods.data.length) {
            const newMethod = stripePaymentMethods.data.filter(
                (method) =>
                    method.type === 'card' &&
                    !user.paymentMethods.find((pm) => pm.id === method.id)
            )
            let message = 'No new payment method found'

            if (newMethod.length) {
                user.paymentSetupIntent = null
                user.paymentMethods.push({
                    id: newMethod[0].id,
                    default: isDefault || false
                })
                await user.save()
                message = 'Payment method added successfully'
            } else {
                const removedMethod = user.paymentMethods.filter(
                    (pm) =>
                        !stripePaymentMethods.data.find(
                            (method) => method.id === pm.id
                        )
                )
                if (removedMethod.length) {
                    user.paymentMethods = user.paymentMethods.filter(
                        (pm) =>
                            !removedMethod.find((method) => method.id === pm.id)
                    )
                    await user.save()
                    message = 'Payment method removed successfully'
                }
            }

            const paymentMethods = await stripeClient.fetchPaymentMethods(user)

            res.status(200).json({
                message,
                paymentMethods
            })
        } else {
            res.status(400).json({
                message: 'No payment method found'
            })
        }
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route to get all payment information about a given customer
app.get('/customer', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(
            req.session.userId,
            'email paymentSetupIntent paymentMethods'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const customers = await stripeClient.customers.list({
            email: user.email,
            limit: 1
        })
        if (!customers.data.length) {
            return res.status(404).json({
                message: 'Customer not found'
            })
        }

        const paymentMethods = await stripeClient.fetchPaymentMethods(user)

        res.status(200).json({
            customer: customers.data[0],
            paymentMethods,
            paymentSetupIntent: user.paymentSetupIntent
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route to change the default payment method
app.patch('/default-method/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params
    try {
        const user = await User.findById(
            req.session.userId,
            'email paymentSetupIntent paymentMethods'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const paymentMethod = user.paymentMethods.find((pm) => pm.id === id)
        if (!paymentMethod) {
            return res.status(404).json({
                message: 'Payment method not found'
            })
        }

        const currentDefault = user.paymentMethods.find((pm) => pm.default)
        if (currentDefault) {
            currentDefault.default = false
        }
        paymentMethod.default = true
        await user.save()

        const paymentMethods = await stripeClient.fetchPaymentMethods(user)

        res.status(200).json({
            message: 'Default payment method updated successfully',
            paymentMethods
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

// Route to delete a payment method
app.delete('/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params
    try {
        const user = await User.findById(
            req.session.userId,
            'email paymentMethods'
        )
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        if (!user.paymentMethods.find((pm) => pm.id === id)) {
            return res.status(404).json({
                message: 'Payment method not found'
            })
        }

        await stripeClient.paymentMethods.detach(id)

        user.paymentMethods = user.paymentMethods.filter((pm) => pm.id !== id)
        await user.save()

        const paymentMethods = await stripeClient.fetchPaymentMethods(user)

        res.status(200).json({
            message: 'Payment method deleted successfully',
            paymentMethods
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

module.exports = app
