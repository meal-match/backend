const express = require('express')

const stripeClient = require('../services/stripeClient')
const { isAuthenticated } = require('../utils/authUtils')
const User = require('../models/user')

const app = express()

app.get('/setup-intent', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(
            req.session.userId,
            'email paymentSetupIntent'
        )

        if (!user.paymentSetupIntent) {
            return res.status(400).json({
                message: 'Payment setup intent not found'
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

app.delete('/setup-intent', isAuthenticated, async (req, res) => {
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

        const paymentMethods = await stripeClient.paymentMethods.list({
            customer: customer.data[0].id
        })

        if (paymentMethods.data.length) {
            user.paymentSetupIntent = null
            await user.save()

            res.status(200).json({
                message: 'Payment method added successfully'
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

// Gets all stripe information about a given customer
// Might not be necessary but we can keep for now
app.get('/customer', isAuthenticated, async (req, res) => {
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

        const customers = await stripeClient.customers.list({
            email: user.email,
            limit: 1
        })

        if (!customers.data.length) {
            return res.status(404).json({
                message: 'Customer not found'
            })
        }

        const paymentMethods = await stripeClient.paymentMethods.list({
            customer: customers.data[0].id
        })

        res.status(200).json({
            customer: customers.data[0],
            paymentMethods: paymentMethods.data,
            paymentSetupIntent: user.paymentSetupIntent
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

module.exports = app
