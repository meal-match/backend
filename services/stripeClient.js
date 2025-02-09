const Stripe = require('stripe')
const dotenv = require('dotenv')

dotenv.config()

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

stripe.fetchCustomer = async (email) => {
    const customers = await stripe.customers.list({
        email,
        limit: 1
    })
    if (!customers.data.length) {
        return null
    }
    return customers.data[0]
}

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

stripe.fetchDefaultPaymentMethod = async (user) => {
    const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
    })
    if (!customers.data.length) {
        return null
    }

    const paymentMethods = await stripe.paymentMethods.list({
        customer: customers.data[0].id,
        type: 'card'
    })
    if (!paymentMethods.data.length) {
        return null
    }

    const defaultPaymentMethod = user.paymentMethods.find((pm) => pm.default)
    if (defaultPaymentMethod) {
        return paymentMethods.data.find(
            (pm) => pm.id === defaultPaymentMethod.id
        )
    }
    return paymentMethods.data[0]
}

stripe.checkIfAccountSetupIsComplete = async (accountId) => {
    try {
        const account = await stripe.accounts.retrieve(accountId)

        const { requirements } = account
        const { currently_due, past_due } = requirements

        return currently_due.length === 0 && past_due.length === 0
    } catch (err) {
        return false
    }
}

module.exports = stripe
