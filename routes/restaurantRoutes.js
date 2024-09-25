const express = require('express')
const Restaurant = require('../models/restaurant')

const app = express()

// Restaurants route
app.get('/', async (req, res) => {
    try {
        let restaurants = await Restaurant.find()

        // Iterate through each restaurant to handle the logic for sides, drinks, and sauces
        restaurants = restaurants.map((restaurant) => {
            return {
                restaurant: restaurant.restaurant,
                meals: restaurant.meals.map((meal) => {
                    return {
                        entree: meal.entree,
                        entreeCustomizations: meal.entreeCustomizations,
                        sides: meal.sides || restaurant.defaultSides,
                        drinks: meal.drinks || restaurant.defaultDrinks,
                        sauces: meal.sauces || restaurant.defaultSauces
                    }
                })
            }
        })

        res.status(200).json({ restaurants, status: 200 })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        })
    }
})

module.exports = app
