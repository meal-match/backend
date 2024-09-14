const Stripe = require('stripe')
const dotenv = require('dotenv')

dotenv.config()

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

const methods = {}

methods.listAccounts = async () => {
    try {
        const accounts = await stripe.accounts.list()
        return accounts
    } catch (e) {
        console.error(e)
    }
}

module.exports = methods
