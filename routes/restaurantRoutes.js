const express = require('express')
const Restaurant = require('../models/restaurant')
const { isAuthenticated } = require('../utils/authUtils')

const app = express()

// Restaurants route
app.get('/', isAuthenticated, async (req, res) => {
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
                        maxEntreeCustomizations:
                            meal.maxEntreeCustomizations ||
                            restaurant.defaultMaxEntreeCustomizations,
                        sides: meal.sides
                            ? meal.sides.map((side) => {
                                  return {
                                      side: side.side,
                                      sideCustomizations:
                                          side.sideCustomizations,
                                      maxSideCustomizations:
                                          side.maxSideCustomizations ||
                                          restaurant.defaultMaxSideCustomizations
                                  }
                              })
                            : restaurant.defaultSides.map((side) => {
                                  return {
                                      side: side.side,
                                      sideCustomizations:
                                          side.sideCustomizations,
                                      maxSideCustomizations:
                                          side.maxSideCustomizations ||
                                          restaurant.defaultMaxSideCustomizations
                                  }
                              }),
                        drinks: meal.drinks
                            ? meal.drinks.map((drink) => {
                                  return {
                                      drink: drink.drink,
                                      drinkCustomizations:
                                          drink.drinkCustomizations,
                                      maxDrinkCustomizations:
                                          drink.maxDrinkCustomizations ||
                                          restaurant.defaultMaxDrinkCustomizations
                                  }
                              })
                            : restaurant.defaultDrinks.map((drink) => {
                                  return {
                                      drink: drink.drink,
                                      drinkCustomizations:
                                          drink.drinkCustomizations,
                                      maxDrinkCustomizations:
                                          drink.maxDrinkCustomizations ||
                                          restaurant.defaultMaxDrinkCustomizations
                                  }
                              }),
                        sauces: meal.sauces || restaurant.defaultSauces,
                        maxSauces: meal.maxSauces || restaurant.defaultMaxSauces
                    }
                }),
                hours: restaurant.hours
            }
        })

        res.status(200).json({ restaurants })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Internal server error'
        })
    }
})

module.exports = app
