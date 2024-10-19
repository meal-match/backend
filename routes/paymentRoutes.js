const express = require('express')

const stripeClient = require('../services/stripeClient')
const { isAuthenticated } = require('../utils/authUtils')
const User = require('../models/user')

const app = express()

app.post('/method', isAuthenticated, async (req, res) => {
    const { paymentMethodID } = req.body

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

        if (!paymentMethodID) {
            return res.status(400).json({
                message: 'Required fields are missing'
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

        await stripeClient.paymentMethods.attach(paymentMethodID, {
            customer: customer.id
        })

        user.paymentSetupIntent = null
        await user.save()

        res.status(200).json({
            message: 'Payment method added successfully'
        })
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
