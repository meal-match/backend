const express = require('express')

const app = express()

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next()
    } else {
        res.status(401).send('Unauthorized')
    }
}

// Profile route
app.get('/', isAuthenticated, (req, res) => {
    res.send('This is your profile')
})

module.exports = app
