const Stripe = require('stripe')
const dotenv = require('dotenv')

dotenv.config()

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

stripe.fetchPaymentMethods = async (user) => {
    const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
    })
    if (!customers.data.length) {
        return []
    }

    const paymentMethods = await stripe.paymentMethods.list({
        customer: customers.data[0].id,
        type: 'card'
    })
    const defaultPaymentMethod = user.paymentMethods.find((pm) => pm.default)
    for (const method of paymentMethods.data) {
        method.default = method.id === defaultPaymentMethod?.id
    }

    return paymentMethods.data
}

stripe.fetchPayoutMethods = async (user) => {
    const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
    })
    if (!customers.data.length) {
        return []
    }

    const payoutMethods = await stripe.paymentMethods.list({
        customer: customers.data[0].id,
        type: 'us_bank_account'
    })
    const defaultPayoutMethod = user.payoutMethods.find((pm) => pm.default)
    for (const method of payoutMethods.data) {
        method.default = method.id === defaultPayoutMethod?.id
    }

    return payoutMethods.data
}

module.exports = stripe
